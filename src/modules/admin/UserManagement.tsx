import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Check, 
  Loader2,
  AlertCircle,
  Eye,      // Nuevo
  EyeOff    // Nuevo
} from 'lucide-react';
import ToastSystem, { Toast } from '../../components/ToastSystem';

// Definición de Roles del Sistema
const AVAILABLE_ROLES = [
  { id: 'ADMIN', label: 'Super Admin', desc: 'Acceso total al sistema' },
  { id: 'PRICING_ACCESS', label: 'Pricing Manager', desc: 'Gestión de tarifarios' },
  { id: 'GASTRO_ACCESS', label: 'Gastronomía', desc: 'Gestión de presupuestos' },
  { id: 'STOCK_ACCESS', label: 'Stock Hotelero', desc: 'Control de inventario' },
];

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  permissions: string[];
  created_at?: string;
}

const UserManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Estado para el Modal (Crear/Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Estados de visibilidad de contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '', // Nuevo campo
    fullName: '',
    permissions: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NOTIFICACIONES ---
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg, type }]);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- CARGAR USUARIOS ---
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      notify('Error al cargar usuarios', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- MANEJO DEL FORMULARIO ---
  const handleOpenModal = (userToEdit?: UserProfile) => {
    // Resetear visibilidad al abrir
    setShowPassword(false);
    setShowConfirmPassword(false);

    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        email: userToEdit.email,
        password: '', 
        confirmPassword: '',
        fullName: userToEdit.full_name,
        permissions: userToEdit.permissions || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const togglePermission = (roleId: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(roleId);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== roleId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, roleId] };
      }
    });
  };

  // --- GUARDAR (CREAR O EDITAR) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. MODO EDICIÓN (Solo actualizamos perfil)
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            permissions: formData.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        notify('Usuario actualizado correctamente', 'success');
      } 
      
      // 2. MODO CREACIÓN (Nuevo Usuario)
      else {
        // VALIDACIONES DE CONTRASEÑA
        if (!formData.password || formData.password.length < 6) {
            notify('La contraseña debe tener al menos 6 caracteres', 'error');
            setIsSubmitting(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            notify('Las contraseñas NO coinciden', 'error');
            setIsSubmitting(false);
            return;
        }

        // TRUCO: Creamos un cliente temporal para no perder la sesión del Admin
        const tempSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        // A. Crear usuario en Auth
        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.fullName } 
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("No se pudo obtener el ID del usuario creado.");

        const newUserId = authData.user.id;

        // B. Insertar en tabla Profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            email: formData.email,
            full_name: formData.fullName,
            permissions: formData.permissions
          });

        if (profileError) {
           console.error("Error creando perfil:", profileError);
           throw new Error("El usuario se creó pero falló al asignar permisos.");
        }

        notify('Usuario creado exitosamente', 'success');
      }

      setIsModalOpen(false);
      fetchUsers(); 

    } catch (error: any) {
      console.error('Error saving user:', error);
      notify(error.message || 'Ocurrió un error al guardar', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('¿Estás seguro? Esto eliminará el acceso del usuario al sistema.')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      notify('Usuario eliminado del sistema', 'success');
      fetchUsers();
    } catch (error) {
      notify('Error al eliminar usuario', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastSystem toasts={toasts} removeToast={removeToast} />

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <button onClick={onBack} className="text-slate-500 hover:text-slate-700 text-sm font-semibold mb-2 flex items-center gap-1">
             ← Volver al Menú
           </button>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Shield className="text-castor-red" size={32} />
             Gestión de Usuarios
           </h1>
           <p className="text-slate-500 mt-1">Administra accesos y roles del personal de Cerro Castor.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-slate-900 text-white px-5 py-3 rounded-lg font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* LISTA DE USUARIOS */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                <Loader2 className="animate-spin mb-2" size={32} />
                Cargando usuarios...
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Usuario</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Roles Asignados</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha Alta</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-200 p-2 rounded-full text-slate-600">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{u.full_name || 'Sin Nombre'}</p>
                                            <p className="text-xs text-slate-500">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {u.permissions && u.permissions.length > 0 ? u.permissions.map(p => (
                                            <span key={p} className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                                p === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {p.replace('_ACCESS', '').replace('_', ' ')}
                                            </span>
                                        )) : (
                                            <span className="text-xs text-slate-400 italic">Sin permisos</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(u)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Editar Permisos"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        {currentUser?.id !== u.id && ( 
                                            <button 
                                                onClick={() => handleDelete(u.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Eliminar Acceso"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {editingUser ? <Edit2 size={18} /> : <UserPlus size={18} />}
                        {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Campos Básicos */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                            <input 
                                type="text" required
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-slate-900 focus:border-slate-900"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                            <input 
                                type="email" required
                                disabled={!!editingUser} 
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className={`w-full border-slate-300 rounded-lg shadow-sm focus:ring-slate-900 focus:border-slate-900 ${editingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                placeholder="usuario@cerrocastor.com"
                            />
                        </div>
                        
                        {!editingUser && (
                            <>
                                {/* CAMPO: CONTRASEÑA */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña Inicial</label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            required
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-slate-900 focus:border-slate-900 pr-10"
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* CAMPO: CONFIRMAR CONTRASEÑA */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? 'text' : 'password'} 
                                            required
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                            className={`w-full border-slate-300 rounded-lg shadow-sm focus:ring-slate-900 focus:border-slate-900 pr-10 ${
                                                formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                            }`}
                                            placeholder="Repite la contraseña"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                        <p className="text-xs text-red-500 mt-1 font-bold">Las contraseñas no coinciden</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Selector de Roles */}
                    <div className="border-t border-slate-100 pt-4 mt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <Shield size={14} /> Asignar Roles y Permisos
                        </label>
                        <div className="space-y-2">
                            {AVAILABLE_ROLES.map(role => {
                                const isSelected = formData.permissions.includes(role.id);
                                return (
                                    <div 
                                        key={role.id}
                                        onClick={() => togglePermission(role.id)}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                            isSelected 
                                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                                        }`}>
                                            {isSelected && <Check size={12} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                                                {role.label}
                                            </p>
                                            <p className="text-xs text-slate-500">{role.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Modal */}
                    <div className="flex gap-3 pt-4 mt-2">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSubmitting || (!editingUser && formData.password !== formData.confirmPassword)}
                            className="flex-1 py-3 bg-castor-red text-white font-bold rounded-lg shadow hover:bg-red-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;