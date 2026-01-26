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
  Loader2,
  Eye,      
  EyeOff    
} from 'lucide-react';
import ToastSystem, { Toast } from '../../components/ToastSystem';
import { UserRole } from '../../types';

// Definición de Roles del Sistema (Mapping para UI)
const ROLE_OPTIONS: { id: UserRole; label: string; desc: string }[] = [
  { id: 'admin', label: 'Super Admin', desc: 'Control total del sistema' },
  { id: 'pricing_manager', label: 'Pricing Manager', desc: 'Gestión de tarifarios' },
  { id: 'user', label: 'Usuario Básico', desc: 'Acceso de lectura restringido' },
];

interface DbUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole; // Importante: String, no array
  created_at?: string;
}

const UserManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DbUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DbUserProfile | null>(null);
  
  // Passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '', 
    fullName: '',
    role: 'user' as UserRole // Default
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NOTIFICACIONES ---
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg, type }]);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- FETCH USERS ---
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

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

  // --- MODAL HANDLERS ---
  const handleOpenModal = (userToEdit?: DbUserProfile) => {
    setShowPassword(false);
    setShowConfirmPassword(false);

    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        email: userToEdit.email,
        password: '', 
        confirmPassword: '',
        fullName: userToEdit.full_name,
        role: userToEdit.role || 'user'
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'user'
      });
    }
    setIsModalOpen(true);
  };

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. EDITAR
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            role: formData.role, // Guardamos string
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        notify('Usuario actualizado', 'success');
      } 
      
      // 2. CREAR
      else {
        if (!formData.password || formData.password.length < 6) {
            notify('Contraseña debe tener mín 6 caracteres', 'error');
            setIsSubmitting(false); return;
        }
        if (formData.password !== formData.confirmPassword) {
            notify('Las contraseñas no coinciden', 'error');
            setIsSubmitting(false); return;
        }

        // Usamos cliente secundario para no cerrar sesión del admin
        const tempSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.fullName } }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Error obteniendo ID del nuevo usuario");

        // Insertar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role // Guardamos string
          });

        if (profileError) {
           console.error("Error creating profile:", profileError);
           // Intento de fallback update por si el trigger ya creó la fila
           await supabase.from('profiles').update({ role: formData.role }).eq('id', authData.user.id);
        }

        notify('Usuario creado exitosamente', 'success');
      }

      setIsModalOpen(false);
      fetchUsers(); 

    } catch (error: any) {
      console.error(error);
      notify(error.message || 'Error al procesar solicitud', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      notify('Usuario eliminado', 'success');
      fetchUsers();
    } catch (error) {
      notify('Error al eliminar', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastSystem toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <div>
           <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm font-bold mb-1">← Volver</button>
           <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
             <Shield className="text-castor-red" /> Gestión de Usuarios
           </h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-slate-700 flex gap-2 items-center"
        >
          <UserPlus size={20} /> Nuevo Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
            <div className="p-12 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2"/> Cargando...</div>
        ) : (
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nombre</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rol</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-200 p-2 rounded-full text-slate-600"><Users size={20} /></div>
                                    <div>
                                        <p className="font-bold text-slate-800">{u.full_name}</p>
                                        <p className="text-xs text-slate-500">{u.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                                    u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                                    u.role === 'pricing_manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                    {ROLE_OPTIONS.find(r => r.id === u.role)?.label || u.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                <button onClick={() => handleOpenModal(u)} className="p-2 text-slate-400 hover:text-blue-600 rounded"><Edit2 size={18} /></button>
                                {currentUser?.id !== u.id && (
                                    <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 rounded"><Trash2 size={18} /></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                        <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border-slate-300 rounded-lg p-2" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input type="email" required disabled={!!editingUser} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-slate-300 rounded-lg p-2 disabled:bg-slate-100" />
                    </div>

                    {!editingUser && (
                        <div className="grid grid-cols-2 gap-4">
                             <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border-slate-300 rounded-lg p-2 pr-8" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-8 text-gray-400"><Eye size={14}/></button>
                                </div>
                             </div>
                             <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar</label>
                                <div className="relative">
                                    <input type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full border-slate-300 rounded-lg p-2 pr-8" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-8 text-gray-400"><Eye size={14}/></button>
                                </div>
                             </div>
                        </div>
                    )}

                    <div className="border-t pt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rol Asignado</label>
                        <div className="space-y-2">
                            {ROLE_OPTIONS.map(role => (
                                <label key={role.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === role.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-slate-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="role" 
                                        value={role.id} 
                                        checked={formData.role === role.id}
                                        onChange={() => setFormData({...formData, role: role.id})}
                                        className="text-blue-600 focus:ring-blue-500 mr-3"
                                    />
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{role.label}</div>
                                        <div className="text-xs text-slate-500">{role.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-castor-red text-white font-bold rounded-lg hover:bg-red-800 disabled:opacity-50 flex justify-center items-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Guardar
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