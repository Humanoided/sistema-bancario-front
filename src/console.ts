import inquirer from "inquirer";
import * as core from "./lib/core";

interface Movimiento {
  id: number; // Cambia a 'number' para coincidir con el tipo del core
  fecha: string;
  tipo: string;
  monto: number;
  saldoAnterior: number;
  saldoNuevo: number;
}

interface Usuario {
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
}

let usuarioActual: Usuario | null = null;

const mainMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Sistema Bancario - Menú Principal",
      choices: [
        { name: "1. Iniciar Sesión", value: "login" },
        { name: "2. Registrar Usuario", value: "register" },
        { name: "3. Salir", value: "exit" },
      ],
    },
  ]);

  switch (action) {
    case "login":
      await loginMenu();
      break;
    case "register":
      await registerMenu();
      break;
    case "exit":
      console.log("Gracias por usar el sistema bancario.");
      process.exit(0);
  }
};

const loginMenu = async () => {
  const answers = await inquirer.prompt([
    { type: "input", name: "cedula", message: "Cédula:" },
    { type: "password", name: "password", message: "Contraseña:" },
  ]);

  const response = core.iniciarSesion(answers.cedula, answers.password);

  if (response.success) {
    usuarioActual = response.usuario ?? null;
    if (usuarioActual) {
      console.log(`\nBienvenido, ${usuarioActual.nombre}`);
      await dashboardMenu();
    } else {
      console.error("\nError: No se pudo obtener el usuario.");
      await mainMenu();
    }
  } else {
    console.error(`\nError: ${response.message}`);
    await mainMenu();
  }
};

const registerMenu = async () => {
  const answers = await inquirer.prompt([
    { type: "input", name: "nombre", message: "Nombre:" },
    { type: "input", name: "cedula", message: "Cédula:" },
    { type: "input", name: "celular", message: "Celular:" },
    { type: "input", name: "email", message: "Email:" },
    { type: "password", name: "password", message: "Contraseña:" },
  ]);

  if (core.registrarUsuario(answers)) {
    console.log("\nUsuario registrado exitosamente.");
  } else {
    console.error("\nError: El usuario ya existe.");
  }
  await mainMenu();
};

const dashboardMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Dashboard",
      choices: [
        { name: "1. Consultar Saldo", value: "saldo" },
        { name: "2. Retirar", value: "retirar" },
        { name: "3. Consignar", value: "consignar" },
        { name: "4. Ver Movimientos", value: "movimientos" },
        { name: "5. Cambiar Contraseña", value: "password" },
        { name: "6. Cerrar Sesión", value: "logout" },
      ],
    },
  ]);

  switch (action) {
    case "saldo":
      if (usuarioActual) {
        console.log(`\nSaldo actual: $${usuarioActual.saldo.toLocaleString()}`);
      } else {
        console.error("\nError: Usuario no autenticado.");
      }
      break;
    case "retirar":
      await retirarMenu();
      break;
    case "consignar":
      await consignarMenu();
      break;
    case "movimientos":
      viewMovimientos();
      break;
    case "password":
      await changePasswordMenu();
      break;
    case "logout":
      usuarioActual = null;
      console.log("\nSesión cerrada.");
      await mainMenu();
      return;
  }
  await dashboardMenu();
};

const retirarMenu = async () => {
  const { monto } = await inquirer.prompt([
    { type: "number", name: "monto", message: "Monto a retirar:" },
  ]);
  if (!usuarioActual) {
    console.error("\nError: Usuario no autenticado.");
    return;
  }
  const response = core.retirar(usuarioActual, monto);
  if (response.success) {
    usuarioActual = response.usuario ?? null;
  }
  console.log(`\n${response.message}`);
};

const consignarMenu = async () => {
  const { monto } = await inquirer.prompt([
    { type: "number", name: "monto", message: "Monto a consignar:" },
  ]);
  if (!usuarioActual) {
    console.error("\nError: Usuario no autenticado.");
    return;
  }
  const response = core.consignar(usuarioActual, monto);
  if (response.success) {
    usuarioActual = response.usuario ?? null;
  }
  console.log(`\n${response.message}`);
};

const viewMovimientos = () => {
  if (!usuarioActual) {
    console.error("\nError: Usuario no autenticado.");
    return;
  }
  console.log("\n--- Historial de Movimientos ---");
  if (usuarioActual.movimientos.length === 0) {
    console.log("No hay movimientos registrados.");
  } else {
    usuarioActual.movimientos.forEach((mov) => {
      console.log(
        `${mov.fecha} - ${
          mov.tipo
        }: $${mov.monto.toLocaleString()} (Saldo: $${mov.saldoNuevo.toLocaleString()})`
      );
    });
  }
  console.log("--------------------------------\n");
};

const changePasswordMenu = async () => {
  if (!usuarioActual) {
    console.error("\nError: Usuario no autenticado.");
    return;
  }
  const answers = await inquirer.prompt([
    { type: "password", name: "passwordActual", message: "Contraseña Actual:" },
    { type: "password", name: "passwordNuevo", message: "Nueva Contraseña:" },
  ]);
  const response = core.cambiarPassword(
    usuarioActual,
    answers.passwordActual,
    answers.passwordNuevo
  );
  if (response.success) {
    usuarioActual = response.usuario ?? null;
  }
  console.log(`\n${response.message}`);
};

const start = async () => {
  console.log("Iniciando sistema bancario en consola...");
  await mainMenu();
};

start();
