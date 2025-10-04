import type { Cuenta, UserData, Usuario } from "@/lib/core";
import {
  consignar as consignarCore,
  obtenerCuenta as obtenerCuentaCore,
  registrarUsuario,
  retirar as retirarCore,
} from "@/lib/core";
import { readDb, writeDb } from "@/lib/database";

interface ICliente {
  nombre: string;
  apellido: string;
  usuario: string;
  documento: string;
  direccion: string;
  contrasena: string;
  saldo: number;
  historial: string[];
}

const createDefaultAccounts = (): Usuario["cuentas"] => ({
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

export class Cliente {
  private data: Usuario;
  private apellido: string;
  private userName: string;
  private direccion: string;
  private contrasena: string;
  private saldo: number;
  private historial: string[];
  private cuentas: Usuario["cuentas"];

  constructor({
    nombre,
    apellido,
    usuario,
    documento,
    direccion,
    contrasena,
    celular = "",
    email = "",
    cuentas,
    intentosFallidos = 0,
    bloqueado = false,
  }: ICliente) {
    this.apellido = apellido;
    this.userName = usuario;
    this.direccion = direccion;
    this.contrasena = contrasena;
    this.saldo = saldo;
    this.userName = usuario;
    this.historial = [];
    this.cuentas = createDefaultAccounts();
  }

  /* movimiento(descripcion: string, monto: number, idUser: string) {
    const fecha = new Date().toLocaleString();
    this.historial.push(`[${fecha}] ${descripcion}`);
    agregarMovimiento(this as unknown as Usuario, "retiro", monto);
    const usuarios = readDb();
    const usuario = usuarios[idUser];
    if (!usuario) {
      return `Usuario no encontrado`;
    }

    const resultado = consignarCore(usuario, monto, cuentaId);
    if (!resultado.success || !resultado.usuario || !resultado.cuenta) {
      return resultado.message ?? `No fue posible registrar la consignación`;
    }

    if (idUser === this.data.id) {
      this.sincronizar(resultado.usuario);
    }

    return `Consignacion exitosa. Nuevo saldo en ${resultado.cuenta.tipo} $${resultado.cuenta.saldo}`;
  }

  retiros(retiro: number, cuentaId: string = "ahorros") {
    if (retiro <= 0) {
      return `Revise monto a retirar. Monto a retirar debe ser mayor a 0 y no puede ser mayor al saldo`;
    }

    const usuarios = readDb();
    const usuario = usuarios[this.data.id];
    if (!usuario) {
      return `Usuario no encontrado`;
    }

    const resultado = retirarCore(usuario, retiro, cuentaId);
    if (!resultado.success || !resultado.usuario || !resultado.cuenta) {
      return resultado.message ?? `No fue posible registrar el retiro`;
    }

    this.sincronizar(resultado.usuario);
    return `Retiro exitoso. Saldo actual en ${resultado.cuenta.tipo} $${resultado.cuenta.saldo}`;
  }

  consultarMovimientos(cuentaId: string = "ahorros") {
    const cuenta = this.obtenerCuentaLocal(cuentaId);
    if (cuenta.movimientos.length === 0) {
      return `${this.data.nombre} no tiene movimientos registrados en ${cuenta.tipo}`;
    }

    const historial = cuenta.movimientos
      .map(
        (mov) =>
          `${mov.fecha} - ${mov.tipo}: $${mov.monto.toLocaleString()} (Saldo: $${mov.saldoNuevo.toLocaleString()})`
      )
      .join("\n");

    return `historial de movimientos ${this.data.nombre} (${cuenta.tipo}): \n${historial}`;
  }

  transferencias(
    monto: number,
    cliente: Cliente,
    cuentaOrigen: string = "ahorros",
    cuentaDestino: string = "ahorros"
  ) {
    if (monto <= 0) {
      return `Debe ser mayor a 0`;
    }

    const usuarios = readDb();
    const origen = usuarios[this.data.id];
    if (!origen) {
      return `Usuario no encontrado`;
    }

    const cuentaOrigenDb = obtenerCuentaCore(origen, cuentaOrigen);
    if (!cuentaOrigenDb || monto > cuentaOrigenDb.saldo) {
      return `Fondos insuficientes`;
    }

    const resultadoRetiro = retirarCore(origen, monto, cuentaOrigen);
    if (!resultadoRetiro.success || !resultadoRetiro.usuario || !resultadoRetiro.cuenta) {
      return resultadoRetiro.message ?? `No fue posible realizar la transferencia`;
    }

    const usuariosActualizados = readDb();
    const destinoUsuario = usuariosActualizados[cliente.id];
    if (!destinoUsuario) {
      return `Cliente destino no encontrado`;
    }

    const resultadoConsignacion = consignarCore(destinoUsuario, monto, cuentaDestino);
    if (!resultadoConsignacion.success || !resultadoConsignacion.usuario || !resultadoConsignacion.cuenta) {
      return resultadoConsignacion.message ?? `No fue posible realizar la transferencia`;
    }

    this.sincronizar(resultadoRetiro.usuario);
    cliente.actualizarInstancia(resultadoConsignacion.usuario);

    console.log(
      `Transferencia de $${monto} a ${cliente.nombre} exitosa. Nuevo saldo: $${resultadoRetiro.cuenta.saldo}`
    );
  }

  guardar() {
    const usuarios = readDb();
    usuarios[this.data.id] = this.clonarUsuario(this.data);
    writeDb(usuarios);
    return true;
  }

  registrarUsuario(datos: UserData): boolean {
    return registrarUsuario(datos);
  }

  createUser(
    nombre: string,
    cedula: string,
    celular: string,
    email: string,
    password: string
  ): Usuario {
    const cuentas = [crearCuenta(cedula, "ahorros"), crearCuenta(cedula, "corriente")];
    return {
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
    };
  }

  static cargar(documento: string): Cliente | null {
    const usuarios = readDb();
    const data = usuarios[documento];
    if (!data) {
      return null;
    }

    return new Cliente({
      nombre: data.nombre,
      apellido: "",
      usuario: documento,
      documento: data.cedula,
      direccion: "",
      contrasena: data.password,
      celular: data.celular,
      email: data.email,
      cuentas: data.cuentas,
      intentosFallidos: data.intentosFallidos,
      bloqueado: data.bloqueado,
    });
  }
}
