import { readDb, writeDb } from "./database";

// Interfaces
export type Movimiento = {
  id: number;
  tipo: "retiro" | "consignación" | string;
  monto: number;
  fecha: string;
  saldoAnterior: number;
  saldoNuevo: number;
};

export type Cuenta = {
  id: string;
  tipo: "ahorros" | "corriente" | string;
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
  cuentas: Cuenta[];
  intentosFallidos: number;
  bloqueado: boolean;
};

export type UserData = Omit<
  Usuario,
  "id" | "cuentas" | "intentosFallidos" | "bloqueado"
> & {
  password: string;
};

type LoginResponse = {
  success: boolean;
  message?: string;
  usuario?: Usuario;
};

// Estructura de datos del usuario
const createUser = (
  nombre: string,
  cedula: string,
  celular: string,
  email: string,
  password: string
): Usuario => {
  const cuentas: Cuenta[] = ["ahorros", "corriente"].map((tipo) => ({
    id: `${cedula}-${tipo}`,
    tipo,
    saldo: 0,
    movimientos: [],
  }));

  return {
    id: cedula,
    nombre,
    cedula,
    celular,
    email,
    password,
    cuentas,
    intentosFallidos: 0,
    bloqueado: false,
  };
};

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
    const usuarioActualizado = {
      ...usuario,
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

  const actualizado: Usuario = {
    ...actual,
    ...cambios,
  };

  usuarios[usuario.id] = actualizado;
  writeDb(usuarios);

  return { success: true, message: "Datos actualizados", usuario: actualizado };
};

const agregarMovimiento = (
  usuario: Usuario,
  cuentaId: string,
  tipo: "retiro" | "consignacion",
  monto: number
): { usuario: Usuario; cuenta: Cuenta } | null => {
  const cuenta = obtenerCuenta(usuario, cuentaId);

  if (!cuenta) {
    return null;
  }

  const movimiento = {
    id: Date.now(),
    tipo,
    monto,
    fecha: new Date().toLocaleString(),
    saldoAnterior: cuenta.saldo,
    saldoNuevo: tipo === "retiro" ? cuenta.saldo - monto : cuenta.saldo + monto,
  };

  const cuentasActualizadas = usuario.cuentas.map((c) =>
    c.id === cuenta.id
      ? {
          ...c,
          saldo: movimiento.saldoNuevo,
          movimientos: [...c.movimientos, movimiento],
        }
      : c
  );

  const usuarioActualizado = {
    ...usuario,
    cuentas: cuentasActualizadas,
  };

  actualizarUsuario(usuarioActualizado);
  const cuentaActualizada = obtenerCuenta(usuarioActualizado, cuenta.id)!;
  return { usuario: usuarioActualizado, cuenta: cuentaActualizada };
};

export const obtenerCuenta = (
  usuario: Usuario,
  cuentaId: string = "ahorros"
): Cuenta | undefined =>
  usuario.cuentas.find(
    (cuenta) => cuenta.id === cuentaId || cuenta.tipo === cuentaId
  );

export const retirar = (
  usuario: Usuario,
  monto: number,
  cuentaId: string = "ahorros"
) => {
  const cuenta = obtenerCuenta(usuario, cuentaId);

  if (!cuenta) {
    return { success: false, message: "Cuenta no encontrada" };
  }

  if (monto <= 0) {
    return { success: false, message: "El monto debe ser mayor a 0" };
  }
  if (monto > cuenta.saldo) {
    return { success: false, message: "Saldo insuficiente" };
  }
  const resultado = agregarMovimiento(usuario, cuenta.id, "retiro", monto);

  if (!resultado) {
    return { success: false, message: "No fue posible registrar el movimiento" };
  }

  const { usuario: usuarioActualizado, cuenta: cuentaActualizada } = resultado;
  return {
    success: true,
    message: `Retiro exitoso. Saldo actual en ${cuentaActualizada.tipo}: $${cuentaActualizada.saldo.toLocaleString()}`,
    usuario: usuarioActualizado,
    cuenta: cuentaActualizada,
  };
};

export const consignar = (
  usuario: Usuario,
  monto: number,
  cuentaId: string = "ahorros"
) => {
  const cuenta = obtenerCuenta(usuario, cuentaId);

  if (!cuenta) {
    return { success: false, message: "Cuenta no encontrada" };
  }

  if (monto <= 0) {
    return { success: false, message: "El monto debe ser mayor a 0" };
  }
  const resultado = agregarMovimiento(usuario, cuenta.id, "consignacion", monto);

  if (!resultado) {
    return { success: false, message: "No fue posible registrar el movimiento" };
  }

  const { usuario: usuarioActualizado, cuenta: cuentaActualizada } = resultado;
  return {
    success: true,
    message: `Consignación exitosa. Saldo actual en ${cuentaActualizada.tipo}: $${cuentaActualizada.saldo.toLocaleString()}`,
    usuario: usuarioActualizado,
    cuenta: cuentaActualizada,
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
  const usuarioActualizado = { ...usuario, password: passwordNuevo };
  actualizarUsuario(usuarioActualizado);
  return {
    success: true,
    message: "Contraseña actualizada exitosamente",
    usuario: usuarioActualizado,
  };
};
