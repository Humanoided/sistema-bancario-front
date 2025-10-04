type TipoCuenta = "ahorros" | "corriente";

type Movimiento = {
  id: number;
  tipo: "retiro" | "consignacion" | string;
  monto: number;
  fecha: string;
  saldoAnterior: number;
  saldoNuevo: number;
  cuenta: TipoCuenta;
};

type Cuenta = {
  id: TipoCuenta;
  nombre: string;
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
  saldo: number;
  movimientos: Movimiento[];
  cuentas: Record<TipoCuenta, Cuenta>;
  intentosFallidos: number;
  bloqueado: boolean;
};

type Database = {
  [key: string]: Usuario;
};

export const readDb = (): Database => {
  const data = localStorage.getItem("usuarios");
  return data ? JSON.parse(data) : {};
};

export const writeDb = (data: Database) => {
  localStorage.setItem("usuarios", JSON.stringify(data));
};
