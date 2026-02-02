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
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

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

  const getRoleBadgeVariant = (role: UserRole): 'primary' | 'secondary' | 'default' => {
    switch (role) {
      case 'admin': return 'primary';
      case 'pricing_manager': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ToastSystem toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <PageHeader
        title="Gestion de Usuarios"
        subtitle="Administracion de accesos y roles"
        icon={<Shield size={20} />}
        onBack={onBack}
        actions={[
          {
            label: 'Nuevo Usuario',
            onClick: () => handleOpenModal(),
            variant: 'primary',
            icon: <UserPlus size={18} />,
          },
        ]}
      />

      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Table */}
        <Card>
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin inline mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Cargando usuarios...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Nombre</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">Rol</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u, idx) => (
                    <tr key={u.id} className={`hover:bg-muted/50 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-100 p-2 rounded-full text-primary">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {ROLE_OPTIONS.find(r => r.id === u.role)?.label || u.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleOpenModal(u)} 
                            className="p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          {currentUser?.id !== u.id && (
                            <button 
                              onClick={() => handleDelete(u.id)} 
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
        </Card>
      </main>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        description={editingUser ? 'Modifica los datos del usuario' : 'Completa los datos para crear un nuevo usuario'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="user-form" loading={isSubmitting} icon={<Save size={16} />}>
              Guardar
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            type="text"
            required
            value={formData.fullName}
            onChange={e => setFormData({...formData, fullName: e.target.value})}
          />
          
          <Input
            label="Email"
            type="email"
            required
            disabled={!!editingUser}
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />

          {!editingUser && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contrasena"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <Input
                label="Confirmar"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                rightElement={
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>
          )}

          <div className="border-t border-border pt-4">
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Rol Asignado</label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(role => (
                <label 
                  key={role.id} 
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.role === role.id 
                      ? 'bg-primary-50 border-primary ring-1 ring-primary' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="role" 
                    value={role.id} 
                    checked={formData.role === role.id}
                    onChange={() => setFormData({...formData, role: role.id})}
                    className="text-primary focus:ring-primary mr-3"
                  />
                  <div>
                    <div className="font-semibold text-sm text-foreground">{role.label}</div>
                    <div className="text-xs text-muted-foreground">{role.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
