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

type Movimiento = {
  id: number;
  tipo: "retiro" | "consignación" | string;
  monto: number;
  fecha: string;
  saldoAnterior: number;
  saldoNuevo: number;
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
