import { useState, useCallback, useEffect, useMemo } from "react";
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
import * as core from "./lib/core";
import type { Cuenta, Movimiento, TipoCuenta, Usuario, UserData } from "./lib/core";
import { Moon, Sun } from "lucide-react";

type LoginResponse = {
  success: boolean;
  message?: string;
  usuario?: Usuario;
};

type Operaciones = {
  retirar: (monto: number, cuenta: TipoCuenta) => void;
  consignar: (
    monto: number,
    cuentaOrigen: TipoCuenta,
    destinatarioId?: string,
    cuentaDestino?: TipoCuenta
  ) => void;
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
  setPantalla,
  onRegistrar,
}: {
  setPantalla: (pantalla: Pantalla) => void;
  onRegistrar: (formData: UserData) => boolean;
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
    ).every((key: keyof UserData) => {
      const value = formData[key];
      return typeof value === "string" && value.trim() !== "";
    });

    if (allFieldsFilled) {
      const registroUsuario = onRegistrar(formData);
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
  const [cuentaActiva, setCuentaActiva] = useState<TipoCuenta>("ahorros");

  useEffect(() => {
    if (!usuario.cuentas[cuentaActiva]) {
      setCuentaActiva("ahorros");
    }
  }, [usuario, cuentaActiva]);

  const cuentasDisponibles = useMemo(
    () =>
      (Object.entries(usuario.cuentas) as Array<[TipoCuenta, Cuenta]>).map(
        ([id, cuenta]) => ({ id, cuenta })
      ),
    [usuario.cuentas]
  );

  const cuentaSeleccionada = useMemo(
    () => usuario.cuentas[cuentaActiva] ?? cuentasDisponibles[0]?.cuenta,
    [usuario.cuentas, cuentaActiva, cuentasDisponibles]
  );

  const operaciones: Operaciones = {
    retirar: (monto, cuenta) => {
      const res = core.retirar(usuario, monto, cuenta);
      setMensaje(res.message);
      if (res.success && res.usuario) onActualizarUsuario(res.usuario);
      setVista("principal");
    },

    consignar: (monto, cuentaOrigen, destinatarioId, cuentaDestino) => {
      const res = core.consignar(
        usuario,
        monto,
        cuentaOrigen,
        destinatarioId,
        cuentaDestino
      );
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
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span className="text-sm">
              Saldo en {cuentaSeleccionada?.nombre ?? "Cuenta"}
            </span>
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium bg-card">
              $
              {cuentaSeleccionada?.saldo.toLocaleString() ?? "0"}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {mensaje && (
            <Alert>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Cuenta activa
            </Label>
            <div className="flex flex-wrap gap-2">
              {cuentasDisponibles.map(({ id, cuenta }) => (
                <Button
                  key={id}
                  type="button"
                  variant={cuentaActiva === id ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setCuentaActiva(id)}
                >
                  {cuenta.nombre}
                </Button>
              ))}
            </div>
          </div>

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
      cuentaActiva={cuentaActiva}
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
  cuentaActiva,
  operaciones,
  mensaje,
  setMensaje,
  onActualizarUsuario,
}: {
  vista: VistaDashboard;
  setVista: (vista: VistaDashboard | "principal") => void;
  usuario: Usuario;
  cuentaActiva: TipoCuenta;
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
  const [destinatarioId, setDestinatarioId] = useState(usuario.id);
  const [destinatarioValido, setDestinatarioValido] = useState(true);
  const [cuentaDestino, setCuentaDestino] = useState<TipoCuenta | "">("");
  const [destinatario, setDestinatario] = useState<Usuario | null>(usuario);

  const cuentaActivaInfo =
    usuario.cuentas[cuentaActiva] ?? Object.values(usuario.cuentas)[0];

  useEffect(() => {
    if (vista === "consignar") {
      setDestinatarioId(usuario.id);
      setCuentaDestino("");
      setDestinatario(usuario);
      setDestinatarioValido(true);
    }
  }, [vista, usuario]);

  useEffect(() => {
    if (vista !== "consignar") return;

    if (!destinatarioId) {
      setDestinatario(null);
      setDestinatarioValido(false);
      return;
    }

    if (destinatarioId === usuario.id) {
      setDestinatario(usuario);
      setDestinatarioValido(true);
      return;
    }

    const encontrado = core.obtenerUsuarioPorId(destinatarioId);
    if (!encontrado) {
      setDestinatario(null);
      setDestinatarioValido(false);
      return;
    }

    setDestinatario(encontrado);
    if (cuentaDestino && !encontrado.cuentas[cuentaDestino as TipoCuenta]) {
      setCuentaDestino("");
      setDestinatarioValido(false);
    } else {
      setDestinatarioValido(true);
    }
  }, [vista, destinatarioId, cuentaDestino, usuario]);

  const cuentasDestino = useMemo(() => {
    if (!destinatario) return [];
    return (Object.entries(destinatario.cuentas) as Array<[
      TipoCuenta,
      Cuenta
    ]>).map(([id, cuenta]) => ({ id, cuenta }));
  }, [destinatario]);

  const botonDeshabilitado = useMemo(() => {
    if (vista === "retirar" || vista === "consignar") {
      const montoNum = Number(monto);
      if (!monto || isNaN(montoNum) || montoNum <= 0) return true;
      if (vista === "consignar") {
        return !destinatarioValido || !destinatarioId;
      }
    }
    if (vista === "cambiarPassword") {
      return !passwordActual || !passwordNuevo;
    }
    return false;
  }, [vista, monto, destinatarioValido, destinatarioId, passwordActual, passwordNuevo]);

  const handleSubmit = () => {
    if (vista === "retirar" || vista === "consignar") {
      const montoNum = Number(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        setMensaje("Ingrese un monto válido");
        return;
      }

      if (vista === "retirar") {
        operaciones.retirar(montoNum, cuentaActiva);
      } else if (vista === "consignar") {
        if (!destinatarioValido || !destinatarioId) {
          setMensaje("Verifica la información del destinatario");
          return;
        }

        const esOtroUsuario = destinatario && destinatario.id !== usuario.id;
        const destinoSeleccionado: TipoCuenta | undefined = esOtroUsuario
          ? (cuentaDestino ? (cuentaDestino as TipoCuenta) : "ahorros")
          : cuentaDestino
          ? (cuentaDestino as TipoCuenta)
          : cuentaActiva;

        operaciones.consignar(
          montoNum,
          cuentaActiva,
          destinatarioId,
          destinoSeleccionado
        );
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
    setDestinatarioId(usuario.id);
    setCuentaDestino("");
    setDestinatario(usuario);
    setDestinatarioValido(true);
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
          <CardDescription>
            Saldo disponible en {cuentaActivaInfo?.nombre ?? "la cuenta seleccionada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-3xl font-bold mb-4">
            $
            {cuentaActivaInfo?.saldo.toLocaleString() ?? "0"}
          </div>

          <Button onClick={volver} className="w-full">
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (vista === "movimientos") {
    const movimientosCuenta = cuentaActivaInfo?.movimientos ?? [];
    return (
      <Card className="w-full max-w-lg mx-auto card-elevated">
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            Movimientos de {cuentaActivaInfo?.nombre ?? "la cuenta seleccionada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {movimientosCuenta.length === 0 ? (
              <p className="text-muted-foreground">
                No hay movimientos registrados en esta cuenta
              </p>
            ) : (
              movimientosCuenta.map((mov: Movimiento) => (
                <div key={mov.id} className="mov-item text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="capitalize font-medium">
                      {mov.tipo === "consignacion" ? "consignación" : mov.tipo}
                    </span>
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
                    Saldo final:{" "}
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
        {(vista === "retirar" || vista === "consignar") && cuentaActivaInfo && (
          <CardDescription>
            Operación sobre {cuentaActivaInfo.nombre}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {mensaje && (
          <Alert className="mb-4">
            <AlertDescription>{mensaje}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {(vista === "retirar" || vista === "consignar") && cuentaActivaInfo && (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{cuentaActivaInfo.nombre}</span>
                <span className="font-bold">
                  ${cuentaActivaInfo.saldo.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Saldo disponible para esta operación.
              </p>
            </div>
          )}

          {(vista === "retirar" || vista === "consignar") && (
            <div className="space-y-2">
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

          {vista === "consignar" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="destinatarioId">ID del destinatario</Label>
                <Input
                  id="destinatarioId"
                  type="text"
                  value={destinatarioId}
                  onChange={(e) => setDestinatarioId(e.target.value.trim())}
                  placeholder="Número de documento"
                  required
                />
                <p
                  className={`text-xs ${
                    destinatarioId
                      ? destinatarioValido
                        ? "text-muted-foreground"
                        : "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {destinatarioId
                    ? destinatarioValido
                      ? destinatario?.id === usuario.id
                        ? "Consignarás a tu propia cuenta."
                        : `Destinatario: ${destinatario?.nombre ?? "Desconocido"}.`
                      : "No se encontró un usuario con ese ID."
                    : "Ingresa el ID del destinatario para continuar."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuentaDestino">Cuenta destino (opcional)</Label>
                <select
                  id="cuentaDestino"
                  value={cuentaDestino}
                  onChange={(event) =>
                    setCuentaDestino(event.target.value as TipoCuenta | "")
                  }
                  disabled={!destinatario || !destinatarioValido}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {destinatario && destinatario.id !== usuario.id
                      ? "Cuenta de ahorros (predeterminada)"
                      : `Usar ${cuentaActivaInfo?.nombre ?? "cuenta activa"}`}
                  </option>
                  {cuentasDestino.map(({ id, cuenta }) => (
                    <option key={id} value={id}>
                      {cuenta.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {destinatario && destinatario.id !== usuario.id
                    ? "Si no seleccionas una cuenta, la consignación irá a la cuenta de ahorros."
                    : "Si no seleccionas una cuenta, usaremos la cuenta activa."}
                </p>
              </div>
            </>
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
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={botonDeshabilitado}
            >
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
          <FormularioRegistro setPantalla={setPantalla} onRegistrar={core.registrarUsuario} />
        {pantalla === "registro" && (
          <FormularioRegistro setPantalla={setPantalla} onRegistrar={core.registrarUsuario} />
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
