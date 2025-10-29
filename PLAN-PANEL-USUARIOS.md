# 📋 PLAN: Hacer Funcionar el Panel de Usuarios en el Administrador

## 🔍 ANÁLISIS DE PROBLEMAS ACTUALES

### Problemas Identificados:

1. **Seguridad de Contraseñas** ❌
   - Las contraseñas se almacenan en texto plano (sin encriptación)
   - El backend devuelve contraseñas en las respuestas (problema de seguridad)
   - No se usa bcrypt para hashing de contraseñas

2. **Validaciones Insuficientes** ❌
   - No se valida que el username sea único antes de crear
   - No hay validación adecuada de campos requeridos
   - Error handling insuficiente

3. **Endpoints del Backend** ⚠️
   - `getUsers()` devuelve contraseñas (debería excluirlas)
   - `createUser()` no valida username único
   - `updateUser()` no maneja bien contraseñas opcionales
   - Falta manejo de errores HTTP adecuado

4. **Frontend** ⚠️
   - Las funciones tienen fallback a localApi que puede causar confusión
   - No hay manejo de errores claro para el usuario
   - Los mensajes de error no son informativos

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### FASE 1: Instalación de Dependencias de Seguridad

**Objetivo:** Instalar bcrypt para hash de contraseñas

```bash
cd backend
npm install bcrypt
npm install --save-dev @types/bcrypt
```

---

### FASE 2: Mejorar el Backend - AdminService

**Objetivo:** Implementar seguridad y validaciones correctas

#### 2.1. Mejorar `getUsers()`
- ✅ Excluir el campo `password` de la respuesta
- ✅ Retornar solo campos necesarios para el frontend

#### 2.2. Mejorar `createUser()`
- ✅ Hash de contraseña antes de guardar (usando bcrypt)
- ✅ Validar que el username sea único
- ✅ Validar campos requeridos (name, username, password, role)
- ✅ Validar que el rol sea válido (admin, ventas)
- ✅ Manejo de errores adecuado

#### 2.3. Mejorar `updateUser()`
- ✅ Hash de contraseña solo si se proporciona una nueva
- ✅ No actualizar contraseña si el campo está vacío
- ✅ Validar que el username sea único (si se está actualizando)
- ✅ No permitir actualizar al usuario actual si es superadmin (protección)
- ✅ Manejo de errores adecuado

#### 2.4. Mejorar `deleteUser()`
- ✅ Validar que no se pueda eliminar a sí mismo
- ✅ Validar que no se pueda eliminar al superadmin
- ✅ Manejo de errores adecuado

---

### FASE 3: Mejorar el Controlador - AdminController

**Objetivo:** Agregar manejo de errores HTTP correcto

#### 3.1. Endpoint `GET /admin/users`
- ✅ Try-catch para manejar errores
- ✅ Retornar HttpException adecuado en caso de error

#### 3.2. Endpoint `POST /admin/users`
- ✅ Validación de datos de entrada
- ✅ Try-catch con mensajes de error claros
- ✅ Retornar HttpException con status codes apropiados

#### 3.3. Endpoint `PATCH /admin/users/:id`
- ✅ Validar que el usuario exista
- ✅ Try-catch con mensajes de error claros
- ✅ Retornar HttpException con status codes apropiados

#### 3.4. Endpoint `DELETE /admin/users/:id`
- ✅ Validar que el usuario exista
- ✅ Validaciones de seguridad (no eliminar superadmin, etc.)
- ✅ Try-catch con mensajes de error claros

---

### FASE 4: Mejorar el Frontend - api.ts

**Objetivo:** Simplificar y mejorar manejo de errores

#### 4.1. Función `getUsers()`
- ✅ Remover fallback a localApi (solo usar backend)
- ✅ Mejorar manejo de errores
- ✅ Retornar errores claros al componente

#### 4.2. Función `createUser()`
- ✅ Remover fallback a localApi
- ✅ Mejorar manejo de errores
- ✅ Validar datos antes de enviar

#### 4.3. Función `updateUser()`
- ✅ Remover fallback a localApi
- ✅ Mejorar manejo de errores
- ✅ Manejar caso donde password es opcional

#### 4.4. Función `deleteUser()`
- ✅ Remover fallback a localApi
- ✅ Mejorar manejo de errores

---

### FASE 5: Mejorar el Componente AdminUsersPage

**Objetivo:** Mejorar UX y manejo de errores

#### 5.1. Manejo de Errores
- ✅ Mostrar mensajes de error claros al usuario
- ✅ Usar toast notifications en lugar de alerts
- ✅ Validar formulario antes de enviar

#### 5.2. Validaciones del Formulario
- ✅ Validar username único (feedback visual)
- ✅ Validar contraseña (mínimo 6 caracteres)
- ✅ Confirmar eliminación con mejor UI

---

## 📝 CAMBIOS TÉCNICOS DETALLADOS

### Backend - admin.service.ts

```typescript
// Agregar import de bcrypt
import * as bcrypt from 'bcrypt';

// getUsers - Excluir password
async getUsers() {
  const users = await this.prisma.adminUser.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      // password: false - NO incluir
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return users;
}

// createUser - Hash password y validaciones
async createUser(data: Prisma.AdminUserCreateInput) {
  // Validar campos requeridos
  if (!data.username || !data.name || !data.password) {
    throw new BadRequestException('Username, name, and password are required');
  }
  
  // Validar username único
  const existingUser = await this.prisma.adminUser.findUnique({
    where: { username: data.username }
  });
  if (existingUser) {
    throw new BadRequestException('Username already exists');
  }
  
  // Hash de contraseña
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  // Crear usuario con password hasheada
  return this.prisma.adminUser.create({
    data: {
      ...data,
      password: hashedPassword
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
      // NO incluir password en respuesta
    }
  });
}

// updateUser - Hash password solo si se proporciona
async updateUser(id: string, data: Prisma.AdminUserUpdateInput) {
  // Verificar que el usuario existe
  const existingUser = await this.prisma.adminUser.findUnique({
    where: { id }
  });
  if (!existingUser) {
    throw new NotFoundException('User not found');
  }
  
  // Validar username único si se está actualizando
  if (data.username) {
    const usernameTaken = await this.prisma.adminUser.findFirst({
      where: {
        username: data.username,
        NOT: { id }
      }
    });
    if (usernameTaken) {
      throw new BadRequestException('Username already exists');
    }
  }
  
  // Hash de contraseña solo si se proporciona
  const updateData: any = { ...data };
  if (data.password && typeof data.password === 'string') {
    updateData.password = await bcrypt.hash(data.password, 10);
  }
  
  return this.prisma.adminUser.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

// deleteUser - Validaciones de seguridad
async deleteUser(id: string) {
  const user = await this.prisma.adminUser.findUnique({
    where: { id }
  });
  
  if (!user) {
    throw new NotFoundException('User not found');
  }
  
  // No permitir eliminar superadmin
  if (user.role === 'superadmin') {
    throw new BadRequestException('Cannot delete superadmin user');
  }
  
  return this.prisma.adminUser.delete({
    where: { id }
  });
}
```

### Backend - admin.controller.ts

```typescript
// Agregar manejo de errores en todos los endpoints
@Get('users')
async getUsers() {
  try {
    return await this.adminService.getUsers();
  } catch (error) {
    console.error('Error getting users:', error);
    throw new HttpException(
      error.message || 'Error al obtener usuarios',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

@Post('users')
async createUser(@Body() data: Prisma.AdminUserCreateInput) {
  try {
    return await this.adminService.createUser(data);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof BadRequestException) {
      throw error; // Re-throw para mantener el status code
    }
    throw new HttpException(
      error.message || 'Error al crear usuario',
      HttpStatus.BAD_REQUEST
    );
  }
}

@Patch('users/:id')
async updateUser(
  @Param('id') id: string,
  @Body() data: Prisma.AdminUserUpdateInput
) {
  try {
    return await this.adminService.updateUser(id, data);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    throw new HttpException(
      error.message || 'Error al actualizar usuario',
      HttpStatus.BAD_REQUEST
    );
  }
}

@Delete('users/:id')
async deleteUser(@Param('id') id: string) {
  try {
    await this.adminService.deleteUser(id);
    return { message: 'Usuario eliminado exitosamente' };
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    throw new HttpException(
      error.message || 'Error al eliminar usuario',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
```

### Frontend - api.ts

```typescript
// Simplificar funciones, remover fallback a localApi
export const getUsers = async (): Promise<AdminUser[]> => {
  const response = await fetch(`${API_URL}/admin/users`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al obtener usuarios' }));
    throw new Error(error.message || 'Error al obtener usuarios');
  }
  return handleResponse(response);
};

export const createUser = async (
  user: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AdminUser> => {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al crear usuario' }));
    throw new Error(error.message || 'Error al crear usuario');
  }
  return handleResponse(response);
};

export const updateUser = async (
  id: string,
  user: Partial<AdminUser>
): Promise<AdminUser> => {
  const response = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al actualizar usuario' }));
    throw new Error(error.message || 'Error al actualizar usuario');
  }
  return handleResponse(response);
};

export const deleteUser = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al eliminar usuario' }));
    throw new Error(error.message || 'Error al eliminar usuario');
  }
};
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Instalar bcrypt y @types/bcrypt
- [ ] Actualizar getUsers() para NO devolver passwords
- [ ] Actualizar createUser() con hash y validaciones
- [ ] Actualizar updateUser() con hash condicional
- [ ] Actualizar deleteUser() con validaciones de seguridad
- [ ] Agregar manejo de errores en todos los endpoints del controlador
- [ ] Probar endpoints con Postman/Thunder Client

### Frontend
- [ ] Actualizar getUsers() en api.ts (remover fallback)
- [ ] Actualizar createUser() en api.ts (remover fallback)
- [ ] Actualizar updateUser() en api.ts (remover fallback)
- [ ] Actualizar deleteUser() en api.ts (remover fallback)
- [ ] Mejorar manejo de errores en AdminUsersPage
- [ ] Probar crear usuario
- [ ] Probar editar usuario
- [ ] Probar eliminar usuario
- [ ] Verificar que las contraseñas NO se muestran

---

## 🧪 PRUEBAS A REALIZAR

1. **Crear Usuario**
   - ✅ Crear usuario con todos los campos
   - ✅ Intentar crear usuario con username duplicado (debe fallar)
   - ✅ Crear usuario sin campos requeridos (debe fallar)

2. **Editar Usuario**
   - ✅ Editar nombre y rol (sin cambiar password)
   - ✅ Editar password (debe hashear nueva password)
   - ✅ Editar username (debe validar que sea único)
   - ✅ Intentar editar username a uno existente (debe fallar)

3. **Eliminar Usuario**
   - ✅ Eliminar usuario normal
   - ✅ Intentar eliminar superadmin (debe fallar)

4. **Listar Usuarios**
   - ✅ Verificar que NO se muestran passwords
   - ✅ Verificar que se muestran todos los demás campos

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

1. **Contraseñas NUNCA deben:**
   - Ser devueltas en respuestas del API
   - Ser almacenadas en texto plano
   - Aparecer en logs

2. **Validaciones importantes:**
   - Username único
   - Password mínimo 6 caracteres
   - Rol válido (admin, ventas, superadmin)

3. **Protecciones:**
   - No eliminar superadmin
   - No permitir que usuarios se auto-eliminen (opcional)

---

## 📚 REFERENCIAS

- [bcrypt npm](https://www.npmjs.com/package/bcrypt)
- [NestJS Exception Handling](https://docs.nestjs.com/exception-filters)
- [Prisma Select](https://www.prisma.io/docs/concepts/components/prisma-client/select-fields)

