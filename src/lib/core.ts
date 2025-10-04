import { readDb, writeDb } from "./database";

// Interfaces
export type TipoCuenta = "ahorros" | "corriente";

export type Movimiento = {
  id: number;
  tipo: "retiro" | "consignacion" | string;
  monto: number;
  fecha: string;
  saldoAnterior: number;
  saldoNuevo: number;
  cuenta: TipoCuenta;
};

export type Cuenta = {
  id: TipoCuenta;
  nombre: string;
  saldo: number;
  movimientos: Movimiento[];
};

export type Usuario = {
  id: string;
  nombre: string;
  cedula: string;
  celular: string;
  email: string;
  password: string;
  saldo: number;
  movimientos: Movimiento[];
  cuentas: Record<TipoCuenta, Cuenta>;
  intentosFallidos: number;
  bloqueado: boolean;
};

type UsuarioPersistido = Omit<Usuario, "cuentas" | "movimientos" | "saldo"> & {
  cuentas?: Record<TipoCuenta, Partial<Cuenta>>;
  movimientos?: Array<Movimiento | (Movimiento & { cuenta?: TipoCuenta })>;
  saldo?: number;
};

export type UserData = Omit<
  Usuario,
  "id" | "saldo" | "movimientos" | "intentosFallidos" | "bloqueado" | "cuentas"
>;

type LoginResponse = {
  success: boolean;
  message?: string;
  usuario?: Usuario;
};

// Estructura de datos del usuario
const createDefaultAccounts = (): Record<TipoCuenta, Cuenta> => ({
  ahorros: {
    id: "ahorros",
    nombre: "Cuenta de ahorros",
    saldo: 0,
    movimientos: [],
  },
  corriente: {
    id: "corriente",
    nombre: "Cuenta corriente",
    saldo: 0,
    movimientos: [],
  },
});

const normalizarMovimiento = (
  movimiento: Movimiento | (Movimiento & { cuenta?: TipoCuenta })
): Movimiento => ({
  ...movimiento,
  cuenta: movimiento.cuenta ?? "ahorros",
});

const normalizarCuenta = (
  cuenta: Partial<Cuenta> | undefined,
  id: TipoCuenta
): Cuenta => ({
  id,
  nombre:
    cuenta?.nombre ?? (id === "ahorros" ? "Cuenta de ahorros" : "Cuenta corriente"),
  saldo: cuenta?.saldo ?? 0,
  movimientos: (cuenta?.movimientos ?? []).map(normalizarMovimiento),
});

const calcularSaldoTotal = (cuentas: Record<TipoCuenta, Cuenta>): number =>
  Object.values(cuentas).reduce((total, cuenta) => total + cuenta.saldo, 0);

const normalizarUsuario = (usuario: UsuarioPersistido): Usuario => {
  const cuentasBase = usuario.cuentas ?? createDefaultAccounts();
  const cuentas: Record<TipoCuenta, Cuenta> = {
    ahorros: normalizarCuenta(cuentasBase.ahorros, "ahorros"),
    corriente: normalizarCuenta(cuentasBase.corriente, "corriente"),
  };

  // Migración para usuarios sin estructura de cuentas
  if (!usuario.cuentas) {
    cuentas.ahorros = {
      ...cuentas.ahorros,
      saldo: usuario.saldo ?? 0,
      movimientos:
        usuario.movimientos?.map(normalizarMovimiento) ?? cuentas.ahorros.movimientos,
    };
  }

  const movimientosGlobales = usuario.movimientos?.length
    ? usuario.movimientos.map(normalizarMovimiento)
    : [...cuentas.ahorros.movimientos, ...cuentas.corriente.movimientos];

  return {
    ...usuario,
    cuentas,
    saldo: calcularSaldoTotal(cuentas),
    movimientos: movimientosGlobales,
  };
};

const createUser = (
  nombre: string,
  cedula: string,
  celular: string,
  email: string,
  password: string
): Usuario => ({
  id: cedula,
  nombre,
  cedula,
  celular,
  email,
  password,
  saldo: 0,
  movimientos: [],
  cuentas: createDefaultAccounts(),
  intentosFallidos: 0,
  bloqueado: false,
});

export const registrarUsuario = (datos: UserData): boolean => {
  const usuarios = readDb();
  if (usuarios[datos.cedula]) {
    return false; // Usuario ya existe
  }
  const usuario = createUser(
    datos.nombre,
    datos.cedula,
    datos.celular,
    datos.email,
    datos.password
  );
  usuarios[datos.cedula] = usuario;
  writeDb(usuarios);
  return true;
};

export const iniciarSesion = (id: string, password: string): LoginResponse => {
  const usuarios = readDb();
  const usuario = usuarios[id];

  if (!usuario) return { success: false, message: "Usuario no encontrado" };
  if (usuario.bloqueado)
    return { success: false, message: "Cuenta bloqueada por 24 horas" };

  if (usuario.password === password) {
    const usuarioNormalizado = normalizarUsuario(usuario);
    const usuarioActualizado = {
      ...usuarioNormalizado,
      intentosFallidos: 0,
      bloqueado: false,
    };
    usuarios[id] = usuarioActualizado;
    writeDb(usuarios);
    return { success: true, usuario: usuarioActualizado };
  } else {
    const nuevosIntentos = usuario.intentosFallidos + 1;
    const bloqueado = nuevosIntentos >= 3;

    usuarios[id] = {
      ...usuario,
      intentosFallidos: nuevosIntentos,
      bloqueado,
    };
    writeDb(usuarios);

    if (bloqueado) {
      return {
        success: false,
        message: "Cuenta bloqueada por 24 horas, comunícate con tu banco",
      };
    } else {
      const intentosRestantes = 3 - nuevosIntentos;
      return {
        success: false,
        message: `Contraseña incorrecta. Intentos restantes: ${intentosRestantes}`,
      };
    }
  }
};

export const actualizarUsuario = (usuarioActualizado: Usuario) => {
  const usuarios = readDb();
  usuarios[usuarioActualizado.id] = usuarioActualizado;
  writeDb(usuarios);
};

export const actualizarPerfil = (
  usuario: Usuario,
  cambios: Partial<Pick<Usuario, "nombre" | "celular" | "email">>
) => {
  if (!cambios) {
    return { success: false, message: "No hay cambios para guardar" };
  }
  if (cambios.email && !cambios.email.includes("@")) {
    return { success: false, message: "Email no válido" };
  }
  if (cambios.celular && cambios.celular.trim().length < 7) {
    return { success: false, message: "Celular no válido" };
  }

  const usuarios = readDb();
  const actual = usuarios[usuario.id];
  if (!actual) {
    return { success: false, message: "Usuario no encontrado" };
  }

  const actualizado = normalizarUsuario({
    ...actual,
    ...cambios,
  });

  usuarios[usuario.id] = actualizado;
  writeDb(usuarios);

  return { success: true, message: "Datos actualizados", usuario: actualizado };
};

const agregarMovimiento = (
  usuario: Usuario,
  tipo: "retiro" | "consignacion",
  monto: number,
  cuentaId: TipoCuenta
): Usuario => {
  const cuenta = usuario.cuentas[cuentaId];
  if (!cuenta) {
    return usuario;
  }

  const movimiento: Movimiento = {
    id: Date.now(),
    tipo,
    monto,
    fecha: new Date().toLocaleString(),
    saldoAnterior: cuenta.saldo,
    saldoNuevo: tipo === "retiro" ? cuenta.saldo - monto : cuenta.saldo + monto,
    cuenta: cuentaId,
  };

  const cuentaActualizada: Cuenta = {
    ...cuenta,
    saldo: movimiento.saldoNuevo,
    movimientos: [...cuenta.movimientos, movimiento],
  };

  const cuentasActualizadas: Record<TipoCuenta, Cuenta> = {
    ...usuario.cuentas,
    [cuentaId]: cuentaActualizada,
  };

  const usuarioActualizado: Usuario = {
    ...usuario,
    cuentas: cuentasActualizadas,
    saldo: calcularSaldoTotal(cuentasActualizadas),
    movimientos: [...usuario.movimientos, movimiento],
  };

  actualizarUsuario(usuarioActualizado);
  return usuarioActualizado;
};

export const retirar = (usuario: Usuario, monto: number, cuentaId: TipoCuenta) => {
  if (monto <= 0) {
    return { success: false, message: "El monto debe ser mayor a 0" };
  }

  const cuenta = usuario.cuentas[cuentaId];
  if (!cuenta) {
    return { success: false, message: "Cuenta no encontrada" };
  }

  if (monto > cuenta.saldo) {
    return { success: false, message: "Saldo insuficiente" };
  }

  const usuarioActualizado = agregarMovimiento(usuario, "retiro", monto, cuentaId);
  const cuentaActualizada = usuarioActualizado.cuentas[cuentaId];
  return {
    success: true,
    message: `Retiro exitoso. Saldo actual en ${cuentaActualizada.nombre}: $${cuentaActualizada.saldo.toLocaleString()}`,
    usuario: usuarioActualizado,
  };
};

export const obtenerUsuarioPorId = (id: string): Usuario | null => {
  const usuario = readDb()[id];
  if (!usuario) {
    return null;
  }
  return normalizarUsuario(usuario);
};

export const consignar = (
  usuario: Usuario,
  monto: number,
  cuentaOrigen: TipoCuenta,
  destinatarioId?: string,
  cuentaDestino?: TipoCuenta
) => {
  if (monto <= 0) {
    return { success: false, message: "El monto debe ser mayor a 0" };
  }

  const cuentaOrigenData = usuario.cuentas[cuentaOrigen];
  if (!cuentaOrigenData) {
    return { success: false, message: "Cuenta origen no válida" };
  }

  const destinatarioNormalizado =
    destinatarioId && destinatarioId !== usuario.id
      ? obtenerUsuarioPorId(destinatarioId)
      : null;

  if (destinatarioId && destinatarioId !== usuario.id && !destinatarioNormalizado) {
    return { success: false, message: "Destinatario no encontrado" };
  }

  const cuentaDestinoId: TipoCuenta = destinatarioNormalizado
    ? cuentaDestino ?? "ahorros"
    : cuentaDestino ?? cuentaOrigen;

  if (destinatarioNormalizado) {
    const cuentaDestinoData = destinatarioNormalizado.cuentas[cuentaDestinoId];
    if (!cuentaDestinoData) {
      return { success: false, message: "Cuenta destino no válida" };
    }

    if (monto > cuentaOrigenData.saldo) {
      return { success: false, message: "Saldo insuficiente" };
    }

    const usuarioActualizado = agregarMovimiento(
      usuario,
      "retiro",
      monto,
      cuentaOrigen
    );

    agregarMovimiento(destinatarioNormalizado, "consignacion", monto, cuentaDestinoId);

    const cuentaOrigenActualizada = usuarioActualizado.cuentas[cuentaOrigen];

    return {
      success: true,
      message: `Consignación realizada a ${destinatarioNormalizado.nombre}. Saldo actual en ${cuentaOrigenActualizada.nombre}: $${cuentaOrigenActualizada.saldo.toLocaleString()}`,
      usuario: usuarioActualizado,
    };
  }

  const usuarioActualizado = agregarMovimiento(
    usuario,
    "consignacion",
    monto,
    cuentaDestinoId
  );
  const cuentaDestinoActualizada = usuarioActualizado.cuentas[cuentaDestinoId];

  return {
    success: true,
    message: `Consignación exitosa. Saldo actual en ${cuentaDestinoActualizada.nombre}: $${cuentaDestinoActualizada.saldo.toLocaleString()}`,
    usuario: usuarioActualizado,
  };
};

export const cambiarPassword = (
  usuario: Usuario,
  passwordActual: string,
  passwordNuevo: string
) => {
  if (usuario.password !== passwordActual) {
    return { success: false, message: "Contraseña actual incorrecta" };
  }
  if (passwordNuevo.length < 4) {
    return {
      success: false,
      message: "La nueva contraseña debe tener al menos 4 caracteres",
    };
  }
  const usuarioActualizado = normalizarUsuario({
    ...usuario,
    password: passwordNuevo,
  });
  actualizarUsuario(usuarioActualizado);
  return {
    success: true,
    message: "Contraseña actualizada exitosamente",
    usuario: usuarioActualizado,
  };
};
