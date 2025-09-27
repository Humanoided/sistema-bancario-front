import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wallet,
  Eye,
  Banknote,
  History,
  KeyRound,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import * as core from "./lib/core";
import { Moon, Sun } from "lucide-react";
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
  | "cambiarPassword"
  | "editarPerfil";
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
  <Card className="w-full max-w-md mx-auto card-elevated">
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
    <Card className="w-full max-w-md mx-auto card-elevated">
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
    <Card className="w-full max-w-md mx-auto card-elevated">
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
      <Card className="w-full max-w-xl mx-auto card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl sm:text-2xl">
            Hola, <span className="font-semibold">{usuario.nombre}</span>
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span className="text-sm">Saldo actual</span>
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium bg-card">
              ${usuario.saldo.toLocaleString()}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {mensaje && (
            <Alert>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => setVista("retirar")}
              className="h-11 rounded-xl font-medium"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Retirar
            </Button>

            <Button
              onClick={() => setVista("consultar")}
              variant="secondary"
              className="h-11 rounded-xl font-medium btn-secondary-dark"
            >
              <Eye className="mr-2 h-5 w-5" />
              Consultar Saldo
            </Button>

            <Button
              onClick={() => setVista("consignar")}
              variant="secondary"
              className="h-11 rounded-xl font-medium btn-secondary-dark"
            >
              <Banknote className="mr-2 h-5 w-5" />
              Consignar
            </Button>

            <Button
              onClick={() => setVista("movimientos")}
              variant="secondary"
              className="h-11 rounded-xl font-medium btn-secondary-dark"
            >
              <History className="mr-2 h-5 w-5" />
              Movimientos
            </Button>

            <Button
              onClick={() => setVista("cambiarPassword")}
              variant="secondary"
              className="h-11 rounded-xl font-medium btn-secondary-dark"
            >
              <KeyRound className="mr-2 h-5 w-5" />
              Cambiar Contraseña
            </Button>

            <Button
              onClick={() => setVista("editarPerfil")}
              variant="secondary"
              className="h-11 rounded-xl font-medium btn-secondary-dark"
            >
              <UserRound className="mr-2 h-5 w-5" />
              Editar Perfil
            </Button>
          </div>

          <Button
            onClick={onCerrarSesion}
            variant="destructive"
            className="w-full h-11 rounded-xl font-semibold"
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
      onActualizarUsuario={onActualizarUsuario}
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
  onActualizarUsuario,
}: {
  vista: VistaDashboard;
  setVista: (vista: VistaDashboard | "principal") => void;
  usuario: Usuario;
  operaciones: Operaciones;
  mensaje: string;
  setMensaje: (mensaje: string) => void;
  onActualizarUsuario: (usuario: Usuario) => void;
}) => {
  const [monto, setMonto] = useState("");
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [nombre, setNombre] = useState(usuario.nombre);
  const [celular, setCelular] = useState(usuario.celular);
  const [email, setEmail] = useState(usuario.email);

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
      editarPerfil: "Editar Perfil",
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
      editarPerfil: "Guardar",
    };
    return botones[vista];
  };

  if (vista === "consultar") {
    return (
      <Card className="w-full max-w-md mx-auto card-elevated">
        <CardHeader>
          <CardTitle>Consultar Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-3xl font-bold mb-4">
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
      <Card className="w-full max-w-lg mx-auto card-elevated">
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {usuario.movimientos.length === 0 ? (
              <p className="text-muted-foreground">
                No hay movimientos registrados
              </p>
            ) : (
              usuario.movimientos.map((mov: Movimiento) => (
                <div key={mov.id} className="mov-item text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="capitalize font-medium">{mov.tipo}</span>
                    <span
                      className={
                        mov.tipo === "retiro"
                          ? "mov-amount-out"
                          : "mov-amount-in"
                      }
                    >
                      {mov.tipo === "retiro" ? "-" : "+"}$
                      {mov.monto.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(mov.fecha).toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs">
                    Saldo:{" "}
                    <span className="font-medium">
                      ${mov.saldoNuevo.toLocaleString()}
                    </span>
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

  if (vista === "editarPerfil") {
    const guardar = () => {
      const res = core.actualizarPerfil(usuario, { nombre, celular, email });
      setMensaje(res.message);
      if (res.success && res.usuario) {
        onActualizarUsuario(res.usuario); // actualiza estado global
      }
      volver();
    };

    return (
      <Card className="w-full max-w-md mx-auto card-elevated">
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          {mensaje && (
            <Alert className="mb-4">
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={guardar} className="flex-1">
                Guardar
              </Button>
              <Button variant="outline" onClick={volver} className="flex-1">
                Volver
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto card-elevated">
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
    <div className="app-container">
      <header className="border-b border-border bg-card">
        <div className="app-inner py-3 flex items-center justify-end gap-3">
          <button
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => (window as any).__toggleTheme()}
            className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs hover:bg-muted transition"
            title="Cambiar tema"
          >
            <Sun className="h-4 w-4 dark:hidden mr-1" />
            <Moon className="h-4 w-4 hidden dark:inline mr-1" />
            <span className="hidden sm:inline">Tema</span>
          </button>

          {usuarioActual && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {usuarioActual.nombre}
              </span>
              <button
                onClick={cerrarSesion}
                className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs hover:bg-muted transition"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="relative w-full h-44 sm:h-60 overflow-hidden">
        <img
          src="./public/banner.jpg"
          alt="Banner Sistema Bancario"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-black/45"></div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow">
            INNERBANK
          </h2>
          <p className="text-sm sm:text-base opacity-90">
            The Place Where You Follow Dreams
          </p>
        </div>
      </div>

      <main className="app-inner">
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
      </main>
    </div>
  );
}
