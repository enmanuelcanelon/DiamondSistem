# ✅ NOTAS INTERNAS EDITABLE EN DETALLES DE CONTRATO

## 📋 RESUMEN

Implementado un área editable de "Notas Internas" en la página de detalles del contrato (`/contratos/:id`), donde el vendedor puede escribir, editar y guardar notas que solo son visibles para vendedores.

---

## 🎯 FUNCIONALIDAD

### **Vista de Vendedor:**
- ✅ Sección "Notas Internas" siempre visible en detalles del contrato
- ✅ Botón "Agregar Notas" si no hay notas
- ✅ Botón "Editar Notas" si ya existen notas
- ✅ Textarea editable de 6 líneas
- ✅ Botones "Cancelar" y "Guardar"
- ✅ Loading state mientras se guardan
- ✅ Toast de confirmación al guardar
- ✅ Las notas se guardan en la base de datos
- ✅ Solo visibles para vendedores (no aparecen en documentos del cliente)

---

## 📁 ARCHIVOS MODIFICADOS

### **Frontend:**

#### `frontend/src/pages/DetalleContrato.jsx`
**Cambios:**
1. Agregados estados:
   ```javascript
   const [notasInternas, setNotasInternas] = useState('');
   const [editandoNotas, setEditandoNotas] = useState(false);
   ```

2. Inicialización de notas al cargar contrato:
   ```javascript
   onSuccess: (data) => {
     setNotasInternas(data?.notas_vendedor || '');
   }
   ```

3. Mutación para guardar notas:
   ```javascript
   const mutationNotasInternas = useMutation({
     mutationFn: async (notas) => {
       const response = await api.put(`/contratos/${id}/notas`, { notas_vendedor: notas });
       return response.data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries(['contrato', id]);
       setEditandoNotas(false);
       toast.success('✅ Notas guardadas exitosamente');
     }
   });
   ```

4. Handlers:
   ```javascript
   const handleGuardarNotas = () => {
     mutationNotasInternas.mutate(notasInternas);
   };

   const handleCancelarNotas = () => {
     setNotasInternas(contrato?.notas_vendedor || '');
     setEditandoNotas(false);
   };
   ```

5. Reemplazada sección estática de notas con versión editable completa

---

### **Backend:**

#### `backend/src/routes/contratos.routes.js`
**Nuevo endpoint:**
```javascript
/**
 * @route   PUT /api/contratos/:id/notas
 * @desc    Actualizar notas internas del contrato
 * @access  Private (Vendedor)
 */
router.put('/:id/notas', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notas_vendedor } = req.body;

    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(id) }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    const contratoActualizado = await prisma.contratos.update({
      where: { id: parseInt(id) },
      data: {
        notas_vendedor: notas_vendedor || null
      }
    });

    res.json({
      success: true,
      message: 'Notas actualizadas exitosamente',
      contrato: contratoActualizado
    });

  } catch (error) {
    next(error);
  }
});
```

---

## 🎨 VISUAL

### **Modo Vista (Sin Notas):**
```
┌─────────────────────────────────────────────────────────┐
│ 📄 Notas Internas              [Agregar Notas]         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ No hay notas registradas aún.                       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Modo Vista (Con Notas):**
```
┌─────────────────────────────────────────────────────────┐
│ 📄 Notas Internas               [Editar Notas]         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ El cliente pidió...                                 │ │
│ │ Recordar confirmar...                               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Modo Edición:**
```
┌─────────────────────────────────────────────────────────┐
│ 📄 Notas Internas        [Cancelar]  [Guardar]         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Escribe tus notas internas aquí...                  │ │
│ │                                                      │ │
│ │                                                      │ │
│ │                                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│ 💡 Estas notas solo son visibles para vendedores       │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 PRUEBA

1. **Refresca el navegador** (F5)
2. Ve a cualquier contrato: `http://localhost:5173/contratos/:id`
3. Busca la sección **"Notas Internas"** (después de "Paquete y Servicios")
4. Haz clic en **"Agregar Notas"** o **"Editar Notas"**
5. Escribe algo en el textarea
6. Haz clic en **"Guardar"**
7. Verifica que aparece el toast de confirmación
8. Las notas se guardan y se muestran correctamente

---

## ✅ VALIDACIONES

- ✅ Solo vendedores pueden editar (endpoint protegido con `requireVendedor`)
- ✅ Las notas se guardan en `contratos.notas_vendedor`
- ✅ Si el contrato no existe, retorna error 404
- ✅ Loading state mientras se guarda
- ✅ Toast de confirmación al guardar
- ✅ Botón "Cancelar" restaura el valor original
- ✅ Las notas no aparecen en documentos del cliente

---

## 📝 NOTAS TÉCNICAS

- El campo `notas_vendedor` ya existía en la base de datos
- Las notas se guardan con `whitespace-pre-wrap` para respetar saltos de línea
- El textarea tiene 6 filas por defecto (ajustable)
- Las notas pueden ser vacías (se guarda `null`)
- La mutación invalida la caché del contrato para actualizar la vista

---

## 🚀 READY PARA COMMIT

**Título sugerido:**
```
feat: área editable de notas internas en detalles de contrato
```

**Descripción sugerida:**
```
- Agregado área de notas internas editable en /contratos/:id
- Botones para agregar/editar notas
- Endpoint PUT /api/contratos/:id/notas para guardar
- Solo visible/editable para vendedores
- Toast de confirmación al guardar
- Loading state mientras se guarda
```

