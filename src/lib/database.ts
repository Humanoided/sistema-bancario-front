type Movimiento = {
  id: number;
  tipo: "retiro" | "consignación" | string;
  monto: number;
  fecha: string;
  saldoAnterior: number;
  saldoNuevo: number;
};

type Cuenta = {
  id: string;
  tipo: "ahorros" | "corriente" | string;
  saldo: number;
  movimientos: Movimiento[];
};

type Usuario = {
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

type Database = {
  [key: string]: Usuario;
};

const createCuenta = (
  cedula: string,
  tipo: "ahorros" | "corriente"
): Cuenta => ({
  id: `${cedula}-${tipo}`,
  tipo,
  saldo: 0,
  movimientos: [],
});

const migrateUsuario = (
  entrada: Usuario | (Usuario & { saldo?: number; movimientos?: Movimiento[] })
): Usuario => {
  const { cedula } = entrada;

  if (Array.isArray((entrada as Usuario).cuentas)) {
    const cuentas = (entrada as Usuario).cuentas.map((cuenta) => ({
      ...cuenta,
      id: cuenta.id ?? `${cedula}-${cuenta.tipo}`,
      movimientos: Array.isArray(cuenta.movimientos) ? cuenta.movimientos : [],
      saldo: typeof cuenta.saldo === "number" ? cuenta.saldo : 0,
    }));

    const cuentasPorTipo = new Map<string, Cuenta>();
    cuentas.forEach((cuenta) => {
      cuentasPorTipo.set(cuenta.tipo, cuenta);
    });

    ["ahorros", "corriente"].forEach((tipo) => {
      if (!cuentasPorTipo.has(tipo)) {
        cuentasPorTipo.set(tipo, createCuenta(cedula, tipo as "ahorros" | "corriente"));
      }
    });

    return {
      ...entrada,
      cuentas: Array.from(cuentasPorTipo.values()),
    } as Usuario;
  }

  const saldo = typeof (entrada as { saldo?: number }).saldo === "number" ? (entrada as { saldo: number }).saldo : 0;
  const movimientos = Array.isArray((entrada as { movimientos?: Movimiento[] }).movimientos)
    ? ((entrada as { movimientos: Movimiento[] }).movimientos ?? [])
    : [];

  const cuentaAhorros = {
    id: `${cedula}-ahorros`,
    tipo: "ahorros",
    saldo,
    movimientos,
  };

  const cuentaCorriente = createCuenta(cedula, "corriente");

  const { saldo: _saldo, movimientos: _movimientos, ...resto } = entrada as Usuario & {
    saldo?: number;
    movimientos?: Movimiento[];
  };

  return {
    ...resto,
    cuentas: [cuentaAhorros, cuentaCorriente],
  };
};

export const readDb = (): Database => {
  const data = localStorage.getItem("usuarios");
  if (!data) {
    return {};
  }

  const parsed = JSON.parse(data) as Database;

  return Object.entries(parsed).reduce<Database>((acc, [key, usuario]) => {
    acc[key] = migrateUsuario(usuario);
    return acc;
  }, {} as Database);
};

export const writeDb = (data: Database) => {
  const serializable = Object.entries(data).reduce<Database>((acc, [key, usuario]) => {
    acc[key] = migrateUsuario(usuario);
    return acc;
  }, {} as Database);

  localStorage.setItem("usuarios", JSON.stringify(serializable));
};
