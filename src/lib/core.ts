import { readDb, writeDb } from "./database";

// Interfaces
type Movimiento = {
  id: number;
  tipo: "retiro" | "consignación" | string;
  monto: number;
  fecha: string;
  saldoAnterior: number;
  saldoNuevo: number;
};

type Usuario = {
  id: string;
  nombre: string;
  cedula: string;
  celular: string;
  email: string;
  password: string;
  saldo: number;
  movimientos: Movimiento[];
  intentosFallidos: number;
  bloqueado: boolean;
};

type UserData = Omit<
  Usuario,
  "id" | "saldo" | "movimientos" | "intentosFallidos" | "bloqueado"
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
): Usuario => ({
  id: cedula,
  nombre,
  cedula,
  celular,
  email,
  password,
  saldo: 0,
  movimientos: [],
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

const agregarMovimiento = (
  usuario: Usuario,
  tipo: string,
  monto: number
): Usuario => {
  const movimiento = {
    id: Date.now(),
    tipo,
    monto,
    fecha: new Date().toLocaleString(),
    saldoAnterior: usuario.saldo,
    saldoNuevo:
      tipo === "retiro" ? usuario.saldo - monto : usuario.saldo + monto,
  };

  const usuarioActualizado = {
    ...usuario,
    saldo: movimiento.saldoNuevo,
    movimientos: [...usuario.movimientos, movimiento],
  };

  actualizarUsuario(usuarioActualizado);
  return usuarioActualizado;
};

export const retirar = (usuario: Usuario, monto: number) => {
  if (monto <= 0) {
    return { success: false, message: "El monto debe ser mayor a 0" };
  }
  if (monto > usuario.saldo) {
    return { success: false, message: "Saldo insuficiente" };
  }
  const usuarioActualizado = agregarMovimiento(usuario, "retiro", monto);
  return {
    success: true,
    message: `Retiro exitoso. Saldo actual: $${usuarioActualizado.saldo.toLocaleString()}`,
    usuario: usuarioActualizado,
  };
};

export const consignar = (usuario: Usuario, monto: number) => {
  if (monto <= 0) {
    return { success: false, message: "El monto debe ser mayor a 0" };
  }
  const usuarioActualizado = agregarMovimiento(usuario, "consignación", monto);
  return {
    success: true,
    message: `Consignación exitosa. Saldo actual: $${usuarioActualizado.saldo.toLocaleString()}`,
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
  const usuarioActualizado = { ...usuario, password: passwordNuevo };
  actualizarUsuario(usuarioActualizado);
  return {
    success: true,
    message: "Contraseña actualizada exitosamente",
    usuario: usuarioActualizado,
  };
};
