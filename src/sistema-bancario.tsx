import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import * as core from "./lib/core";
import { Cliente } from "./backend/Cliente.ts";

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

type Operaciones = {
  retirar: (monto: number) => void;
  consignar: (monto: number) => void;
  cambiarPassword: (actual: string, nuevo: string) => void;
};

type Pantalla =
  | "menu"
  | "login"
  | "registro"
  | "dashboard"
  | "retirar"
  | "consignar"
  | "consultar"
  | "movimientos"
  | "cambiarPassword";
type VistaDashboard = Exclude<
  Pantalla,
  "menu" | "login" | "registro" | "dashboard"
>;

// Componente Menu Principal
const MenuPrincipal = ({
  setPantalla,
}: {
  setPantalla: (pantalla: Pantalla) => void;
}) => (
  <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Sistema Bancario</CardTitle>
      <CardDescription>Selecciona una opción</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button onClick={() => setPantalla("login")} className="w-full">
        1. Iniciar Sesión
      </Button>
      <Button
        onClick={() => setPantalla("registro")}
        variant="outline"
        className="w-full"
      >
        2. Registrar Usuario
      </Button>
    </CardContent>
  </Card>
);

// Componente de Registro
const FormularioRegistro = ({
  onRegistrar,
  setPantalla,
}: {
  onRegistrar: (data: UserData) => boolean;
  setPantalla: (pantalla: Pantalla) => void;
}) => {
  const [formData, setFormData] = useState<UserData>({
    nombre: "",
    cedula: "",
    celular: "",
    email: "",
    password: "",
  });

  const handleSubmit = () => {
    const allFieldsFilled = (
      Object.keys(formData) as Array<keyof UserData>
    ).every((key: keyof UserData) => formData[key].trim() !== "");

    if (allFieldsFilled) {
      const registroUsuario = new Cliente({
        nombre: formData.nombre,
        apellido: "", //TODO: agregar apellido al formulario
        usuario: "", //TODO: agregar usuario al formulario
        documento: formData.cedula,
        direccion: "", //TODO: agregar direccion al formulario
        contrasena: formData.password,
        saldo: 0,
        historial: [] as string[],
      }).guardar();
      if (registroUsuario) {
        alert("Usuario registrado exitosamente");
        setPantalla("menu");
      } else {
        alert("Error: El usuario ya existe");
      }
    } else {
      alert("Por favor complete todos los campos");
    }
  };

  const handleChange = (field: keyof UserData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Registro de Usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="cedula">Cédula</Label>
            <Input
              id="cedula"
              type="text"
              value={formData.cedula}
              onChange={(e) => handleChange("cedula", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="celular">Celular</Label>
            <Input
              id="celular"
              type="tel"
              value={formData.celular}
              onChange={(e) => handleChange("celular", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              Registrar
            </Button>
            <Button
              variant="outline"
              onClick={() => setPantalla("menu")}
              className="flex-1"
            >
              Volver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Login
const FormularioLogin = ({
  onLogin,
  setPantalla,
}: {
  onLogin: (cedula: string, password: string) => LoginResponse;
  setPantalla: (pantalla: Pantalla) => void;
}) => {
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = () => {
    const resultado = onLogin(cedula, password);

    if (resultado.success) {
      setPantalla("dashboard");
    } else {
      setMensaje(resultado.message || "");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cedula">Cédula</Label>
            <Input
              id="cedula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {mensaje && (
            <Alert>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              Ingresar
            </Button>
            <Button
              variant="outline"
              onClick={() => setPantalla("menu")}
              className="flex-1"
            >
              Volver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Dashboard Principal
const Dashboard = ({
  usuario,
  onActualizarUsuario,
  onCerrarSesion,
}: {
  usuario: Usuario;
  onActualizarUsuario: (usuario: Usuario) => void;
  onCerrarSesion: () => void;
}) => {
  const [vista, setVista] = useState<VistaDashboard | "principal">("principal");
  const [mensaje, setMensaje] = useState("");

  const operaciones: Operaciones = {
    retirar: (monto) => {
      const res = core.retirar(usuario, monto);
      setMensaje(res.message);
      if (res.success && res.usuario) onActualizarUsuario(res.usuario);
      setVista("principal");
    },

    consignar: (monto) => {
      const res = core.consignar(usuario, monto);
      setMensaje(res.message);
      if (res.success && res.usuario) onActualizarUsuario(res.usuario);
      setVista("principal");
    },

    cambiarPassword: (passwordActual, passwordNuevo) => {
      const res = core.cambiarPassword(usuario, passwordActual, passwordNuevo);
      setMensaje(res.message);
      if (res.success && res.usuario) onActualizarUsuario(res.usuario);
      setVista("principal");
    },
  };

  if (vista === "principal") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Bienvenido, {usuario.nombre}</CardTitle>
          <CardDescription>
            Saldo actual: ${usuario.saldo.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mensaje && (
            <Alert>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}
          <Button onClick={() => setVista("retirar")} className="w-full">
            Retirar
          </Button>
          <Button
            onClick={() => setVista("consultar")}
            variant="outline"
            className="w-full"
          >
            Consultar Saldo
          </Button>
          <Button
            onClick={() => setVista("consignar")}
            variant="outline"
            className="w-full"
          >
            Consignar
          </Button>
          <Button
            onClick={() => setVista("movimientos")}
            variant="outline"
            className="w-full"
          >
            Consultar Movimientos
          </Button>
          <Button
            onClick={() => setVista("cambiarPassword")}
            variant="outline"
            className="w-full"
          >
            Cambiar Contraseña
          </Button>
          <Separator />
          <Button
            onClick={onCerrarSesion}
            variant="destructive"
            className="w-full"
          >
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <OperacionComponent
      vista={vista}
      setVista={setVista}
      usuario={usuario}
      operaciones={operaciones}
      mensaje={mensaje}
      setMensaje={setMensaje}
    />
  );
};

// Componente para operaciones específicas
const OperacionComponent = ({
  vista,
  setVista,
  usuario,
  operaciones,
  mensaje,
  setMensaje,
}: {
  vista: VistaDashboard;
  setVista: (vista: VistaDashboard | "principal") => void;
  usuario: Usuario;
  operaciones: Operaciones;
  mensaje: string;
  setMensaje: (mensaje: string) => void;
}) => {
  const [monto, setMonto] = useState("");
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");

  const handleSubmit = () => {
    if (vista === "retirar" || vista === "consignar") {
      const montoNum = Number(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        setMensaje("Ingrese un monto válido");
        return;
      }

      if (vista === "retirar") {
        operaciones.retirar(montoNum);
      } else if (vista === "consignar") {
        operaciones.consignar(montoNum);
      }
    } else if (vista === "cambiarPassword") {
      if (!passwordActual || !passwordNuevo) {
        setMensaje("Por favor complete todos los campos");
        return;
      }
      operaciones.cambiarPassword(passwordActual, passwordNuevo);
    }

    setMonto("");
    setPasswordActual("");
    setPasswordNuevo("");
  };

  const volver = () => {
    const nuevaVista: VistaDashboard | "principal" = "principal";
    setVista(nuevaVista);
    setMensaje("");
  };

  const getTitulo = (): string => {
    const titulos: Record<VistaDashboard, string> = {
      retirar: "Retirar Dinero",
      consignar: "Consignar Dinero",
      cambiarPassword: "Cambiar Contraseña",
      consultar: "Consultar Saldo",
      movimientos: "Historial de Movimientos",
    };
    return titulos[vista];
  };

  const getBotonTexto = (): string => {
    const botones: Record<VistaDashboard, string> = {
      retirar: "Retirar",
      consignar: "Consignar",
      cambiarPassword: "Cambiar",
      consultar: "Aceptar",
      movimientos: "Aceptar",
    };
    return botones[vista];
  };

  if (vista === "consultar") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Consultar Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-2xl font-bold mb-4">
            ${usuario.saldo.toLocaleString()}
          </div>
          <Button onClick={volver} className="w-full">
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (vista === "movimientos") {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {usuario.movimientos.length === 0 ? (
              <p>No hay movimientos registrados</p>
            ) : (
              usuario.movimientos.map((mov: Movimiento) => (
                <div key={mov.id} className="p-2 border rounded text-sm">
                  <div className="flex justify-between">
                    <span className="capitalize font-medium">{mov.tipo}</span>
                    <span
                      className={
                        mov.tipo === "retiro"
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      ${mov.monto.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{mov.fecha}</div>
                  <div className="text-xs">
                    Saldo: ${mov.saldoNuevo.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
          <Button onClick={volver} className="w-full">
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{getTitulo()}</CardTitle>
      </CardHeader>
      <CardContent>
        {mensaje && (
          <Alert className="mb-4">
            <AlertDescription>{mensaje}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {(vista === "retirar" || vista === "consignar") && (
            <div>
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                min="1"
                required
              />
            </div>
          )}

          {vista === "cambiarPassword" && (
            <>
              <div>
                <Label htmlFor="passwordActual">Contraseña Actual</Label>
                <Input
                  id="passwordActual"
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="passwordNuevo">Nueva Contraseña</Label>
                <Input
                  id="passwordNuevo"
                  type="password"
                  value={passwordNuevo}
                  onChange={(e) => setPasswordNuevo(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              {getBotonTexto()}
            </Button>
            <Button variant="outline" onClick={volver} className="flex-1">
              Volver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal
export default function SistemaBancario() {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [pantalla, setPantalla] = useState<Pantalla>("menu");

  const registrarUsuario = (datos: UserData): boolean => {
    return core.registrarUsuario(datos);
  };

  const iniciarSesion = (id: string, password: string): LoginResponse => {
    const response = core.iniciarSesion(id, password);
    if (response.success) {
      setUsuarioActual(response.usuario ?? null);
    }
    return response;
  };

  const actualizarUsuario = (usuarioActualizado: Usuario) => {
    core.actualizarUsuario(usuarioActualizado);
    setUsuarioActual(usuarioActualizado);
  };

  const cerrarSesion = () => {
    setUsuarioActual(null);
    setPantalla("menu");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {pantalla === "menu" && <MenuPrincipal setPantalla={setPantalla} />}
      {pantalla === "registro" && (
        <FormularioRegistro
          onRegistrar={registrarUsuario}
          setPantalla={setPantalla}
        />
      )}
      {pantalla === "login" && (
        <FormularioLogin onLogin={iniciarSesion} setPantalla={setPantalla} />
      )}
      {pantalla === "dashboard" && usuarioActual && (
        <Dashboard
          usuario={usuarioActual}
          onActualizarUsuario={actualizarUsuario}
          onCerrarSesion={cerrarSesion}
        />
      )}
    </div>
  );
}
