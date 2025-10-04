import inquirer from "inquirer";
import type { Movimiento, Usuario } from "./lib/core";
import * as core from "./lib/core";
import type { TipoCuenta, Usuario as UsuarioCore } from "./lib/core";

type Usuario = UsuarioCore;

let usuarioActual: Usuario | null = null;
let cuentaActiva: TipoCuenta = "ahorros";

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
      cuentaActiva = "ahorros";
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
      message: `Dashboard - Cuenta activa: ${cuentaActiva}`,
      choices: [
        { name: "1. Consultar Saldo", value: "saldo" },
        { name: "2. Retirar", value: "retirar" },
        { name: "3. Consignar", value: "consignar" },
        { name: "4. Ver Movimientos", value: "movimientos" },
        { name: "5. Cambiar Contraseña", value: "password" },
        { name: "6. Cambiar Cuenta Activa", value: "cuenta" },
        { name: "7. Cerrar Sesión", value: "logout" },
      ],
    },
  ]);

  switch (action) {
    case "saldo":
      if (usuarioActual) {
        const cuenta = usuarioActual.cuentas[cuentaActiva];
        console.log(
          `\nSaldo actual en ${cuenta.nombre}: $${cuenta.saldo.toLocaleString()}`
        );
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
    case "cuenta":
      await selectCuentaMenu();
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
  const response = core.retirar(usuarioActual, monto, cuentaActiva);
  if (response.success) {
    usuarioActual = response.usuario ?? null;
  }
  console.log(`\n${response.message}`);
};

const consignarMenu = async () => {
  const answers = (await inquirer.prompt([
    { type: "number", name: "monto", message: "Monto a consignar:" },
    {
      type: "input",
      name: "destinatarioId",
      message: "ID del destinatario (enter para tu cuenta):",
      default: usuarioActual?.id ?? "",
      filter: (value: string) => value.trim(),
    },
    {
      type: "list",
      name: "cuentaDestino",
      message: "Cuenta destino:",
      choices: [
        { name: "Cuenta de ahorros", value: "ahorros" },
        { name: "Cuenta corriente", value: "corriente" },
      ],
      when: (values) =>
        values.destinatarioId && values.destinatarioId !== usuarioActual?.id,
    },
  ])) as {
    monto: number;
    destinatarioId?: string;
    cuentaDestino?: TipoCuenta;
  };

  if (!usuarioActual) {
    console.error("\nError: Usuario no autenticado.");
    return;
  }
  const response = core.consignar(
    usuarioActual,
    answers.monto,
    cuentaActiva,
    answers.destinatarioId || undefined,
    answers.cuentaDestino
  );
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
  const movimientos = usuarioActual.cuentas[cuentaActiva].movimientos;
  console.log(`\n--- Historial de Movimientos (${cuentaActiva}) ---`);
  if (movimientos.length === 0) {
    console.log("No hay movimientos registrados.");
  } else {
    movimientos.forEach((mov) => {
      console.log(
        `${mov.fecha} - ${
          mov.tipo
        }: $${mov.monto.toLocaleString()} (Saldo: $${mov.saldoNuevo.toLocaleString()})`
      );
    });
  }
  console.log("--------------------------------\n");
};

const selectCuentaMenu = async () => {
  if (!usuarioActual) {
    console.error("\nError: Usuario no autenticado.");
    return;
  }

  const { cuenta } = await inquirer.prompt([
    {
      type: "list",
      name: "cuenta",
      message: "Selecciona la cuenta activa:",
      choices: [
        { name: "Cuenta de ahorros", value: "ahorros" },
        { name: "Cuenta corriente", value: "corriente" },
      ],
      default: cuentaActiva,
    },
  ]);

  cuentaActiva = cuenta;
  console.log(`\nCuenta activa actualizada a: ${cuentaActiva}`);
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
