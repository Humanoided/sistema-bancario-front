import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Interfaces
type Movimiento = {
  id: number;
  tipo: 'retiro' | 'consignación' | string;
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

type UserData = Omit<Usuario, 'id' | 'saldo' | 'movimientos' | 'intentosFallidos' | 'bloqueado'> & {
  password: string;
};

type LoginResponse = {
  success: boolean;
  message?: string;
};

type Operaciones = {
  retirar: (monto: number) => void;
  consignar: (monto: number) => void;
  cambiarPassword: (actual: string, nuevo: string) => void;
};

type Pantalla = 'menu' | 'login' | 'registro' | 'dashboard' | 'retirar' | 'consignar' | 'consultar' | 'movimientos' | 'cambiarPassword';
type VistaDashboard = Exclude<Pantalla, 'menu' | 'login' | 'registro' | 'dashboard'>;

// Estructura de datos del usuario
const createUser = (nombre: string, cedula: string, celular: string, email: string, password: string): Usuario => ({
  id: cedula,
  nombre,
  cedula,
  celular,
  email,
  password,
  saldo: 0,
  movimientos: [],
  intentosFallidos: 0,
  bloqueado: false
});

// Hook personalizado para manejo del estado del sistema
const useBankingSystem = () => {
  const [usuarios, setUsuarios] = useState<Map<string, Usuario>>(new Map());
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [pantalla, setPantalla] = useState<Pantalla>('menu');

  const registrarUsuario = useCallback((datos: UserData): boolean => {
    const usuario = createUser(datos.nombre, datos.cedula, datos.celular, datos.email, datos.password);
    setUsuarios(prev => new Map(prev).set(datos.cedula, usuario));
    return true;
  }, []);

  const iniciarSesion = useCallback((cedula: string, password: string): LoginResponse => {
    const usuario = usuarios.get(cedula);

    if (!usuario) return { success: false, message: 'Usuario no encontrado' };
    if (usuario.bloqueado) return { success: false, message: 'Cuenta bloqueada por 24 horas' };

    if (usuario.password === password) {
      setUsuarios(prev => {
        const newMap = new Map(prev);
        newMap.set(cedula, { ...usuario, intentosFallidos: 0 });
        return newMap;
      });
      setUsuarioActual({ ...usuario, intentosFallidos: 0 });
      return { success: true };
    } else {
      const nuevosIntentos = usuario.intentosFallidos + 1;
      const bloqueado = nuevosIntentos >= 3;

      setUsuarios(prev => {
        const newMap = new Map(prev);
        newMap.set(cedula, {
          ...usuario,
          intentosFallidos: nuevosIntentos,
          bloqueado
        });
        return newMap;
      });

      if (bloqueado) {
        return { success: false, message: 'Cuenta bloqueada por 24 horas, comunícate con tu banco' };
      } else {
        const intentosRestantes = 3 - nuevosIntentos;
        return { success: false, message: `Contraseña incorrecta. Intentos restantes: ${intentosRestantes}` };
      }
    }
  }, [usuarios]);

  const actualizarUsuario = useCallback((usuarioActualizado: Usuario) => {
    setUsuarios(prev => new Map(prev).set(usuarioActualizado.cedula, usuarioActualizado));
    setUsuarioActual(usuarioActualizado);
  }, []);

  const cerrarSesion = useCallback(() => {
    setUsuarioActual(null);
    setPantalla('menu');
  }, []);

  return {
    usuarios,
    usuarioActual,
    pantalla,
    setPantalla,
    registrarUsuario,
    iniciarSesion,
    actualizarUsuario,
    cerrarSesion
  };
};

// Componente Menu Principal
const MenuPrincipal = ({ setPantalla }: { setPantalla: (pantalla: Pantalla) => void }) => (
  <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Sistema Bancario</CardTitle>
      <CardDescription>Selecciona una opción</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button onClick={() => setPantalla('login')} className="w-full">
        1. Iniciar Sesión
      </Button>
      <Button onClick={() => setPantalla('registro')} variant="outline" className="w-full">
        2. Registrar Usuario
      </Button>
    </CardContent>
  </Card>
);

// Componente de Registro
const FormularioRegistro = ({
  onRegistrar,
  setPantalla
}: {
  onRegistrar: (data: UserData) => boolean;
  setPantalla: (pantalla: Pantalla) => void
}) => {
  const [formData, setFormData] = useState<UserData>({
    nombre: '',
    cedula: '',
    celular: '',
    email: '',
    password: ''
  });

  const handleSubmit = () => {
    const allFieldsFilled = (Object.keys(formData) as Array<keyof UserData>).every(
      (key: keyof UserData) => formData[key].trim() !== ''
    );

    if (allFieldsFilled) {
      onRegistrar(formData);
      setPantalla('menu');
      alert('Usuario registrado exitosamente');
    } else {
      alert('Por favor complete todos los campos');
    }
  };

  const handleChange = (field: keyof UserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  type CampoType = {
    key: keyof UserData;
    label: string;
    type: string;
  };

  const campos: CampoType[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' },
    { key: 'cedula', label: 'Cédula', type: 'text' },
    { key: 'celular', label: 'Celular', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'password', label: 'Contraseña', type: 'password' }
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Registro de Usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campos.map(({ key, label, type }) => (
            <div key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={type}
                value={formData[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                required
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">Registrar</Button>
            <Button variant="outline" onClick={() => setPantalla('menu')} className="flex-1">
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
  setPantalla
}: {
  onLogin: (cedula: string, password: string) => LoginResponse;
  setPantalla: (pantalla: Pantalla) => void
}) => {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = () => {
    const resultado = onLogin(cedula, password);

    if (resultado.success) {
      setPantalla('dashboard');
    } else {
      setMensaje(resultado.message);
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
            <Button onClick={handleSubmit} className="flex-1">Ingresar</Button>
            <Button variant="outline" onClick={() => setPantalla('menu')} className="flex-1">
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
  onCerrarSesion
}: {
  usuario: Usuario;
  onActualizarUsuario: (usuario: Usuario) => void;
  onCerrarSesion: () => void
}) => {
  const [vista, setVista] = useState<VistaDashboard>('consultar');
  const [mensaje, setMensaje] = useState('');

  const agregarMovimiento = useCallback((tipo: string, monto: number) => {
    const movimiento = {
      id: Date.now(),
      tipo,
      monto,
      fecha: new Date().toLocaleString(),
      saldoAnterior: usuario.saldo,
      saldoNuevo: tipo === 'retiro' ? usuario.saldo - monto : usuario.saldo + monto
    };

    const usuarioActualizado = {
      ...usuario,
      saldo: movimiento.saldoNuevo,
      movimientos: [...usuario.movimientos, movimiento]
    };

    onActualizarUsuario(usuarioActualizado);
    return usuarioActualizado;
  }, [usuario, onActualizarUsuario]);

  const operaciones: Operaciones = {
    retirar: (monto) => {
      if (monto <= 0) {
        setMensaje('El monto debe ser mayor a 0');
        return;
      }
      if (monto > usuario.saldo) {
        setMensaje('Saldo insuficiente');
        return;
      }
      const usuarioActualizado = agregarMovimiento('retiro', monto);
      setMensaje(`Retiro exitoso. Saldo actual: $${usuarioActualizado.saldo.toLocaleString()}`);
    },

    consignar: (monto) => {
      if (monto <= 0) {
        setMensaje('El monto debe ser mayor a 0');
        return;
      }
      const usuarioActualizado = agregarMovimiento('consignación', monto);
      setMensaje(`Consignación exitosa. Saldo actual: $${usuarioActualizado.saldo.toLocaleString()}`);
    },

    cambiarPassword: (passwordActual, passwordNuevo) => {
      if (usuario.password !== passwordActual) {
        setMensaje('Contraseña actual incorrecta');
        return;
      }
      if (passwordNuevo.length < 4) {
        setMensaje('La nueva contraseña debe tener al menos 4 caracteres');
        return;
      }
      onActualizarUsuario({ ...usuario, password: passwordNuevo });
      setMensaje('Contraseña actualizada exitosamente');
    }
  };

  if (vista === 'consultar') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Bienvenido, {usuario.nombre}</CardTitle>
          <CardDescription>Saldo actual: ${usuario.saldo.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mensaje && (
            <Alert>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}
          <Button onClick={() => setVista('retirar')} className="w-full">Retirar</Button>
          <Button onClick={() => setVista('consultar')} variant="outline" className="w-full">Consultar Saldo</Button>
          <Button onClick={() => setVista('consignar')} variant="outline" className="w-full">Consignar</Button>
          <Button onClick={() => setVista('movimientos')} variant="outline" className="w-full">Consultar Movimientos</Button>
          <Button onClick={() => setVista('cambiarPassword')} variant="outline" className="w-full">Cambiar Contraseña</Button>
          <Separator />
          <Button onClick={onCerrarSesion} variant="destructive" className="w-full">Cerrar Sesión</Button>
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
  setMensaje
}: {
  vista: Exclude<Pantalla, 'menu' | 'login' | 'registro' | 'dashboard'>;
  setVista: (vista: Exclude<Pantalla, 'menu' | 'login' | 'registro' | 'dashboard'>) => void;
  usuario: Usuario;
  operaciones: Operaciones;
  mensaje: string;
  setMensaje: (mensaje: string) => void;
}) => {
  const [monto, setMonto] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');

  const handleSubmit = () => {
    if (vista === 'retirar' || vista === 'consignar') {
      const montoNum = Number(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        setMensaje('Ingrese un monto válido');
        return;
      }

      if (vista === 'retirar') {
        operaciones.retirar(montoNum);
      } else {
        operaciones.consignar(montoNum);
      }
    } else if (vista === 'cambiarPassword') {
      if (!passwordActual || !passwordNuevo) {
        setMensaje('Por favor complete todos los campos');
        return;
      }
      operaciones.cambiarPassword(passwordActual, passwordNuevo);
    }

    setMonto('');
    setPasswordActual('');
    setPasswordNuevo('');
  };

  const volver = () => {
    const nuevaVista: VistaDashboard = 'consultar';
    setVista(nuevaVista);
    setMensaje('');
  };

  const getTitulo = (): string => {
    const titulos: Record<VistaDashboard, string> = {
      retirar: 'Retirar Dinero',
      consignar: 'Consignar Dinero',
      cambiarPassword: 'Cambiar Contraseña',
      consultar: 'Consultar Saldo',
      movimientos: 'Historial de Movimientos'
    };
    return titulos[vista] || vista;
  };

  const getBotonTexto = (): string => {
    const botones: Record<VistaDashboard, string> = {
      retirar: 'Retirar',
      consignar: 'Consignar',
      cambiarPassword: 'Cambiar',
      consultar: 'Aceptar',
      movimientos: 'Aceptar'
    };
    return botones[vista];
  };

  if (vista === 'consultar') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Consultar Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-2xl font-bold mb-4">
            ${usuario.saldo.toLocaleString()}
          </div>
          <Button onClick={volver} className="w-full">Volver</Button>
        </CardContent>
      </Card>
    );
  }

  if (vista === 'movimientos') {
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
                    <span className={mov.tipo === 'retiro' ? 'text-red-600' : 'text-green-600'}>
                      ${mov.monto.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{mov.fecha}</div>
                  <div className="text-xs">Saldo: ${mov.saldoNuevo.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
          <Button onClick={volver} className="w-full">Volver</Button>
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
          {(vista === 'retirar' || vista === 'consignar') && (
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

          {vista === 'cambiarPassword' && (
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
  const {
    usuarioActual,
    pantalla,
    setPantalla,
    registrarUsuario,
    iniciarSesion,
    actualizarUsuario,
    cerrarSesion
  } = useBankingSystem();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {pantalla === 'menu' && <MenuPrincipal setPantalla={setPantalla} />}
      {pantalla === 'registro' && <FormularioRegistro onRegistrar={registrarUsuario} setPantalla={setPantalla} />}
      {pantalla === 'login' && <FormularioLogin onLogin={iniciarSesion} setPantalla={setPantalla} />}
      {pantalla === 'dashboard' && usuarioActual && (
        <Dashboard
          usuario={usuarioActual}
          onActualizarUsuario={actualizarUsuario}
          onCerrarSesion={cerrarSesion}
        />
      )}
    </div>
  );
}