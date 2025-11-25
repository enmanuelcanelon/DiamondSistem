const translations = {
  es: {
    // Navegación
    nav: {
      dashboard: 'Dashboard',
      leads: 'Leads',
      clients: 'Clientes',
      offers: 'Ofertas',
      contracts: 'Contratos',
      calendar: 'Calendario',
      eventManagement: 'Gestión de Eventos',
      commissions: 'Comisiones',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
      language: 'Español',
      principal: 'Principal',
      eventos: 'Eventos',
      finanzas: 'Finanzas',
      configuracion: 'Configuración'
    },
    
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Bienvenido',
      stats: {
        clients: 'Clientes',
        offers: 'Ofertas',
        contracts: 'Contratos',
        sales: 'Ventas',
        commissions: 'Comisiones'
      },
      recentActivity: 'Actividad Reciente',
      monthlyStats: 'Estadísticas Mensuales',
      selectMonth: 'Seleccionar Mes',
      selectYear: 'Seleccionar Año',
      showData: 'Mostrar Datos',
      hideData: 'Ocultar Datos',
      vsPreviousMonth: 'vs mes anterior',
      noData: 'No hay datos disponibles',
      loading: 'Cargando estadísticas...'
    },
    
    // Clientes
    clients: {
      title: 'Clientes',
      newClient: 'Nuevo Cliente',
      editClient: 'Editar Cliente',
      updateSuccess: 'Cliente actualizado exitosamente',
      clientName: 'Nombre Completo',
      fullName: 'Nombre Completo',
      email: 'Email',
      phone: 'Teléfono',
      address: 'Dirección',
      howDidYouKnow: '¿Cómo nos conoció?',
      eventType: 'Tipo de Evento',
      personalInfo: 'Información Personal',
      eventInfo: 'Información del Evento',
      search: 'Buscar cliente...',
      createSuccess: 'Cliente creado exitosamente',
      updateSuccess: 'Cliente actualizado exitosamente',
      deleteSuccess: 'Cliente eliminado exitosamente',
      addFirstClient: 'Comienza agregando tu primer cliente',
      specifyOther: 'Especifique la fuente...',
      saveClient: 'Guardar Cliente',
      savingClient: 'Guardando cliente...',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      view: 'Ver',
      back: 'Volver',
      save: 'Guardar',
      cancel: 'Cancelar',
      loading: 'Cargando clientes...',
      noClients: 'No hay clientes registrados',
      sources: {
        facebook: 'Facebook',
        instagram: 'Instagram',
        google: 'Google',
        recommendation: 'Recomendación',
        other: 'Otro'
      }
    },
    
    // Ofertas
    offers: {
      title: 'Ofertas',
      newOffer: 'Nueva Oferta',
      createProposal: 'Crea una propuesta comercial para tu cliente',
      offerCode: 'Código de Oferta',
      status: 'Estado',
      client: 'Cliente',
      package: 'Paquete',
      date: 'Fecha',
      total: 'Total',
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      downloadPDF: 'Descargar PDF',
      createSuccess: 'Oferta creada exitosamente',
      updateSuccess: 'Oferta actualizada exitosamente',
      search: 'Buscar oferta...',
      filterByStatus: 'Filtrar por estado',
      filterByMonth: 'Filtrar por mes',
      allStatuses: 'Todos los estados',
      loading: 'Cargando ofertas...',
      noOffers: 'No hay ofertas registradas',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      finish: 'Finalizar',
      acceptOffer: 'Aceptar Oferta',
      rejectOffer: 'Rechazar',
      accepting: 'Aceptando...',
      rejecting: 'Rechazando...',
      client: 'Cliente',
      package: 'Paquete',
      total: 'Total',
      steps: {
        clientInfo: 'Información del Cliente',
        eventDetails: 'Detalles del Evento',
        packageSeason: 'Paquete y Temporada',
        additionalServices: 'Servicios Adicionales',
        discount: 'Descuento'
      },
      eventDetails: {
        honoree: 'Homenajeado/a',
        honoreePlaceholder: 'Ej: María López, Juan Pérez',
        honoreeHelp: 'Nombre de la persona homenajeada en el evento (opcional)',
        eventType: 'Tipo de Evento',
        eventTypeHelp: 'Seleccione el tipo de evento para esta oferta',
        eventLocation: 'Lugar del Evento',
        selectLocation: 'Seleccione un lugar',
        externalVenue: 'Otro (Sede Externa - Sin cargo de salón)',
        maxCapacity: 'Capacidad máxima',
        guests: 'invitados',
        numberOfGuests: 'Cantidad de Invitados',
        numberOfGuestsPlaceholder: 'Ej: 50',
        additionalGuests: 'Invitados Adicionales',
        startTime: 'Hora Inicio',
        endTime: 'Hora Fin',
        hour: 'Hora',
        minutes: 'Minutos',
        selectDateFirst: 'Primero selecciona el lugar y la fecha del evento',
        maxTimeAllowed: 'Máximo permitido: 2:00 AM (restricción legal)',
        eventDuration: 'Duración del evento',
        salonAvailable: '✓ El salón está disponible en este horario',
        filtersBySalon: 'Filtros por Salón'
      },
      packageSeason: {
        title: 'Paquete y Temporada',
        package: 'Paquete',
        packageRequired: 'Paquete *',
        selectPackage: 'Seleccionar paquete...',
        specialPackageNote: 'El paquete "Especial" solo está disponible entre las 10:00 AM y las 5:00 PM',
        season: 'Temporada',
        highSeason: 'Temporada Alta',
        adjustment: 'Ajuste',
        autoDetected: 'Auto-detectada según la fecha del evento'
      },
      additionalServices: {
        title: 'Servicios Adicionales',
        add: 'Agregar',
        perPerson: 'por persona',
        alreadyIncluded: 'Ya incluido en paquete',
        upgradeAvailable: 'Upgrade disponible desde el paquete',
        required: '¡REQUERIDO!',
        addHours: 'Agregar',
        hours: 'horas',
        hour: 'hora',
        nextDay: '(día siguiente)',
        maxUntil: 'Máximo hasta 2 AM',
        categories: {
          bebidas: 'Bebidas',
          comida: 'Comida',
          decoracion: 'Decoración',
          entretenimiento: 'Entretenimiento',
          equipos: 'Equipos',
          extras: 'Extras',
          fotografia: 'Fotografía',
          personal: 'Personal',
          transporte: 'Transporte',
          utensilios: 'Utensilios'
        }
      },
      discount: {
        title: 'Descuento',
        discountAmount: 'Descuento ($)',
        maxDiscountAllowed: 'Descuento máximo permitido',
        serviceFee: 'Service Fee (%)',
        serviceFeeHelp: 'Porcentaje del Service Fee (15% - 18%). Por defecto'
      },
      eventTypes: {
        wedding: 'Boda',
        quinceanera: 'Quinceaños',
        birthday: 'Cumpleaños',
        anniversary: 'Aniversario',
        corporate: 'Corporativo',
        graduation: 'Graduación',
        babyShower: 'Baby Shower',
        kidsParty: 'Kids Party',
        sweet16: 'Dulces 16',
        other: 'Otro'
      }
    },
    
    // Contratos
    contracts: {
      title: 'Contratos',
      contractCode: 'Código de Contrato',
      status: 'Estado',
      paymentStatus: 'Estado de Pago',
      client: 'Cliente',
      eventDate: 'Fecha del Evento',
      total: 'Total',
      downloadContract: 'Descargar Contrato',
      downloadInvoice: 'Descargar Factura',
      viewDetails: 'Ver Detalles',
      active: 'Activo',
      completed: 'Completado',
      cancelled: 'Cancelado',
      paid: 'Pagado',
      pending: 'Pendiente',
      partial: 'Parcial',
      loading: 'Cargando contratos...',
      noContracts: 'No hay contratos registrados',
      search: 'Buscar contrato...',
      filterByStatus: 'Filtrar por estado',
      filterByMonth: 'Filtrar por mes',
      allStatuses: 'Todos los estados'
    },
    
    // Formularios comunes
    forms: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      update: 'Actualizar',
      search: 'Buscar...',
      select: 'Seleccionar...',
      loading: 'Cargando...',
      required: 'Este campo es requerido',
      invalidEmail: 'Email inválido',
      invalidPhone: 'Teléfono inválido',
      saveChanges: 'Guardar Cambios',
      discardChanges: 'Descartar Cambios',
      confirm: 'Confirmar',
      close: 'Cerrar'
    },
    
    // Mensajes de error/éxito
    messages: {
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información',
      confirmDelete: '¿Estás seguro de que deseas eliminar esto?',
      operationSuccess: 'Operación completada exitosamente',
      operationError: 'Error al completar la operación',
      deleteSuccess: 'Eliminado exitosamente',
      deleteError: 'Error al eliminar',
      saveSuccess: 'Guardado exitosamente',
      saveError: 'Error al guardar'
    },
    
    // Calendario
    calendar: {
      title: 'Calendario',
      month: 'Mes',
      year: 'Año',
      today: 'Hoy',
      noEvents: 'No hay eventos programados',
      previousMonth: 'Mes Anterior',
      nextMonth: 'Mes Siguiente',
      summary: 'Resumen de'
    },
    
    // Leaks/Leads
    leaks: {
      title: 'Leads',
      available: 'Disponibles',
      myLeads: 'Mis Leads',
      assign: 'Asignar',
      contact: 'Contactar',
      status: 'Estado',
      new: 'Nuevo',
      interested: 'Interesado',
      contacted: 'Contactado',
      notInterested: 'No Interesado',
      pendingContact: 'Pendiente de Contacto',
      loading: 'Cargando leads...',
      noLeads: 'No hay leads disponibles'
    },
    
    // Comisiones
    commissions: {
      title: 'Comisiones',
      total: 'Total de Comisiones',
      monthly: 'Comisiones Mensuales',
      percentage: 'Porcentaje de Comisión',
      sales: 'Ventas',
      commission: 'Comisión',
      loading: 'Cargando comisiones...',
      noCommissions: 'No hay comisiones registradas'
    },
    // Eventos
    eventos: {
      title: 'Gestión de Eventos',
      description: 'Administra tus eventos activos y solicitudes de clientes'
    },
    // Configuración
    configuracion: {
      title: 'Configuración'
    },
    
    // Login
    login: {
      title: 'Iniciar Sesión',
      email: 'Código',
      password: 'Contraseña',
      login: 'Iniciar Sesión',
      loading: 'Iniciando sesión...',
      error: 'Error al iniciar sesión',
      invalidCredentials: 'Credenciales inválidas'
    },
    
    // Configuración
    settings: {
      title: 'Configuración',
      profile: 'Perfil',
      preferences: 'Preferencias',
      language: 'Idioma',
      save: 'Guardar Cambios',
      saved: 'Cambios guardados exitosamente'
    },

    // Mensajes Toast - Éxito
    toast: {
      success: {
        clientCreated: 'Cliente creado exitosamente',
        clientUpdated: 'Cliente actualizado exitosamente',
        clientDeleted: 'Cliente eliminado exitosamente',
        offerCreated: 'Oferta creada exitosamente',
        offerUpdated: 'Oferta actualizada exitosamente',
        offerDeleted: 'Oferta eliminada exitosamente',
        offerRejected: 'Oferta rechazada',
        contractCreated: '¡Contrato creado exitosamente!',
        contractUpdated: 'Contrato actualizado exitosamente',
        statusUpdated: 'Estado actualizado exitosamente',
        googleCalendarConnected: 'Google Calendar conectado exitosamente',
        googleCalendarDisconnected: 'Google Calendar desconectado exitosamente',
        changesSaved: 'Cambios guardados exitosamente',
        leadAssigned: 'Lead asignado exitosamente',
        leadStatusUpdated: 'Estado del lead actualizado exitosamente',
        settingsSaved: 'Configuración guardada exitosamente',
        pdfDownloaded: 'PDF descargado exitosamente',
        emailSent: 'Email enviado exitosamente'
      },
      error: {
        general: 'Ocurrió un error',
        clientCreate: 'Error al crear cliente',
        clientUpdate: 'Error al actualizar cliente',
        clientDelete: 'Error al eliminar cliente',
        offerCreate: 'Error al crear oferta',
        offerUpdate: 'Error al actualizar oferta',
        offerDelete: 'Error al eliminar oferta',
        contractCreate: 'Error al crear contrato',
        contractUpdate: 'Error al actualizar contrato',
        statusUpdate: 'Error al actualizar estado',
        googleCalendarConnect: 'Error al conectar Google Calendar',
        googleCalendarDisconnect: 'Error al desconectar Google Calendar',
        saveChanges: 'Error al guardar cambios',
        leadAssign: 'Error al asignar lead',
        leadStatusUpdate: 'Error al actualizar estado del lead',
        settingsSave: 'Error al guardar configuración',
        pdfDownload: 'Error al descargar el PDF',
        pdfGenerate: 'Error al generar el PDF',
        emailSend: 'Error al enviar el email',
        loadData: 'Error al cargar los datos',
        invalidData: 'Datos inválidos',
        requiredFields: 'Por favor complete todos los campos requeridos',
        unauthorized: 'No está autorizado para realizar esta acción',
        networkError: 'Error de red. Por favor revise su conexión'
      },
      warning: {
        unsavedChanges: 'Tienes cambios sin guardar',
        confirmDelete: '¿Estás seguro de que deseas eliminar esto?',
        cannotUndo: 'Esta acción no se puede deshacer',
        limitReached: 'Has alcanzado el límite',
        checkData: 'Por favor revisa los datos ingresados'
      }
    },

    // Mensajes de Validación
    validation: {
      required: {
        field: 'Este campo es requerido',
        clientName: 'El nombre del cliente es requerido',
        email: 'El email es requerido',
        phone: 'El teléfono es requerido',
        eventType: 'El tipo de evento es requerido',
        eventDate: 'La fecha del evento es requerida',
        eventLocation: 'El lugar del evento es requerido',
        numberOfGuests: 'El número de invitados es requerido',
        package: 'El paquete es requerido',
        viewDate: 'La fecha para ver el salón es requerida',
        notInterestedReason: 'El motivo de por qué no está interesado es requerido',
        contactLaterDate: 'La fecha para contactar nuevamente es requerida',
        startTime: 'La hora de inicio es requerida',
        endTime: 'La hora de fin es requerida'
      },
      invalid: {
        email: 'Email inválido',
        phone: 'Teléfono inválido',
        date: 'Fecha inválida',
        time: 'Hora inválida',
        number: 'Número inválido',
        url: 'URL inválida'
      },
      timeConflict: {
        hoursNotAvailable: 'Las horas seleccionadas no están disponibles. Ya existe un evento programado en ese horario.',
        salonNotAvailable: 'El salón no está disponible para la fecha y hora seleccionada',
        selectDifferentTime: 'Por favor selecciona otro horario'
      }
    },

    // Estados de Carga
    loading: {
      general: 'Cargando...',
      clients: 'Cargando clientes...',
      client: 'Cargando cliente...',
      offers: 'Cargando ofertas...',
      offer: 'Cargando oferta...',
      contracts: 'Cargando contratos...',
      contract: 'Cargando contrato...',
      leads: 'Cargando leads...',
      commissions: 'Cargando comisiones...',
      calendar: 'Cargando calendario...',
      statistics: 'Cargando estadísticas...',
      settings: 'Cargando configuración...',
      profile: 'Cargando perfil...',
      venues: 'Cargando salones...',
      packages: 'Cargando paquetes...',
      services: 'Cargando servicios...',
      contractDetails: 'Cargando detalles del contrato...',
      gallery: 'Cargando galería...',
      photos: 'Cargando fotos...',
      saving: 'Guardando...',
      deleting: 'Eliminando...',
      updating: 'Actualizando...',
      creating: 'Creando...',
      processing: 'Procesando...',
      downloading: 'Descargando...',
      uploading: 'Subiendo...',
      connecting: 'Conectando...'
    },

    // Google Calendar
    googleCalendar: {
      title: 'Google Calendar',
      connect: 'Conectar Google Calendar',
      disconnect: 'Desconectar Google Calendar',
      connected: 'Conectado',
      notConnected: 'No conectado',
      sync: 'Sincronizar con Google Calendar',
      syncing: 'Sincronizando...',
      lastSync: 'Última sincronización',
      connectSuccess: 'Google Calendar conectado exitosamente',
      disconnectSuccess: 'Google Calendar desconectado exitosamente',
      syncSuccess: 'Sincronizado exitosamente',
      connectError: 'Error al conectar Google Calendar',
      disconnectError: 'Error al desconectar Google Calendar',
      syncError: 'Error al sincronizar',
      confirmDisconnect: '¿Estás seguro de que quieres desconectar tu cuenta de Google Calendar?',
      errors: {
        missingParams: 'Faltan parámetros en la respuesta de Google',
        invalidState: 'Solicitud inválida',
        vendedorNotFound: 'Vendedor no encontrado',
        accessDenied: 'Acceso denegado por el usuario'
      }
    },

    // Actualizaciones de Estado de Leads
    leadStatus: {
      updateSuccess: 'Estado del lead actualizado exitosamente',
      updateError: 'Error al actualizar estado del lead',
      assignSuccess: 'Lead asignado exitosamente',
      assignError: 'Error al asignar lead',
      contactSuccess: 'Lead contactado exitosamente',
      contactError: 'Error al contactar lead',
      convertedToClient: 'Lead convertido en cliente exitosamente',
      rateLimitError: 'Demasiadas solicitudes. El sistema se pausará automáticamente. Por favor espera un momento.'
    },

    // Galería/Fotos
    gallery: {
      title: 'Galería',
      photos: 'Fotos',
      uploadPhoto: 'Subir Foto',
      deletePhoto: 'Eliminar Foto',
      viewPhoto: 'Ver Foto',
      noPhotos: 'No hay fotos disponibles',
      uploadSuccess: 'Foto subida exitosamente',
      uploadError: 'Error al subir foto',
      deleteSuccess: 'Foto eliminada exitosamente',
      deleteError: 'Error al eliminar foto',
      loading: 'Cargando',
      loadingError: 'Error al cargar'
    },

    // Validaciones específicas
    specialValidation: {
      specialPackageTimeRestriction: 'El paquete "Especial" solo está disponible entre las 10:00 AM y las 5:00 PM. Por favor, selecciona otro paquete.',
      hoursNotAvailableNewVenue: 'Las horas seleccionadas no están disponibles en el nuevo salón. Por favor, selecciona otras horas.',
      minAdditionalGuests: 'Debes agregar al menos 1 invitado adicional',
      maxGuestsExceeded: 'La cantidad de invitados no puede exceder 500',
      selectService: 'Selecciona un servicio',
      serviceQuantityMin: 'La cantidad del servicio debe ser al menos 1',
      calculatedCostMinimum: 'El costo calculado debe ser mayor a $0',
      venueMaxCapacity: (max, current, requested, total, available) =>
        `La capacidad máxima del salón es ${max} invitados\n\n` +
        `Invitados actuales: ${current}\n` +
        `Invitados solicitados: ${requested}\n` +
        `Total: ${total}\n\n` +
        `Solo puedes solicitar hasta ${available} invitado(s) adicional(es).`
    },

    // Notas y cambios
    notes: {
      saved: 'Notas guardadas exitosamente',
      requestSent: 'Solicitud enviada exitosamente'
    },

    // Dashboard
    dashboardErrors: {
      loadError: 'Error al cargar el dashboard',
      summaryLoadError: 'Error al cargar el resumen'
    },

    // Login messages
    auth: {
      loginSuccess: 'Inicio de sesión exitoso',
      loginError: 'Error al iniciar sesión'
    },

    // Vendedores (Gerente)
    sellers: {
      created: 'Vendedor creado exitosamente',
      updated: 'Vendedor actualizado exitosamente',
      passwordUpdated: 'Contraseña actualizada exitosamente',
      statusChangeError: 'Error al cambiar estado del vendedor',
      createError: 'Error al crear vendedor',
      updateError: 'Error al actualizar vendedor',
      passwordUpdateError: 'Error al cambiar contraseña',
      activated: 'Vendedor activado',
      deactivated: 'Vendedor desactivado'
    },

    // Checklist
    checklist: {
      updated: 'Checklist actualizado exitosamente'
    }
  },
  
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      leads: 'Leads',
      clients: 'Clients',
      offers: 'Offers',
      contracts: 'Contracts',
      calendar: 'Calendar',
      eventManagement: 'Event Management',
      commissions: 'Commissions',
      settings: 'Settings',
      logout: 'Log Out',
      language: 'English',
      principal: 'Main',
      eventos: 'Events',
      finanzas: 'Finance',
      configuracion: 'Settings'
    },
    
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      stats: {
        clients: 'Clients',
        offers: 'Offers',
        contracts: 'Contracts',
        sales: 'Sales',
        commissions: 'Commissions'
      },
      recentActivity: 'Recent Activity',
      monthlyStats: 'Monthly Statistics',
      selectMonth: 'Select Month',
      selectYear: 'Select Year',
      showData: 'Show Data',
      hideData: 'Hide Data',
      vsPreviousMonth: 'vs previous month',
      noData: 'No data available',
      loading: 'Loading statistics...'
    },
    
    // Clients
    clients: {
      title: 'Clients',
      newClient: 'New Client',
      editClient: 'Edit Client',
      updateSuccess: 'Client updated successfully',
      clientName: 'Full Name',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      howDidYouKnow: 'How did you know us?',
      eventType: 'Event Type',
      personalInfo: 'Personal Information',
      eventInfo: 'Event Information',
      search: 'Search client...',
      createSuccess: 'Client created successfully',
      updateSuccess: 'Client updated successfully',
      deleteSuccess: 'Client deleted successfully',
      addFirstClient: 'Start by adding your first client',
      specifyOther: 'Specify the source...',
      saveClient: 'Save Client',
      savingClient: 'Saving client...',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading clients...',
      noClients: 'No registered clients',
      sources: {
        facebook: 'Facebook',
        instagram: 'Instagram',
        google: 'Google',
        recommendation: 'Recommendation',
        other: 'Other'
      }
    },
    
    // Offers
    offers: {
      title: 'Offers',
      newOffer: 'New Offer',
      createProposal: 'Create a commercial proposal for your client',
      offerCode: 'Offer Code',
      status: 'Status',
      client: 'Client',
      package: 'Package',
      date: 'Date',
      total: 'Total',
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      downloadPDF: 'Download PDF',
      createSuccess: 'Offer created successfully',
      updateSuccess: 'Offer updated successfully',
      search: 'Search offer...',
      filterByStatus: 'Filter by status',
      filterByMonth: 'Filter by month',
      allStatuses: 'All statuses',
      loading: 'Loading offers...',
      noOffers: 'No registered offers',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      finish: 'Finish',
      acceptOffer: 'Accept Offer',
      rejectOffer: 'Reject',
      accepting: 'Accepting...',
      rejecting: 'Rejecting...',
      client: 'Client',
      package: 'Package',
      total: 'Total',
      steps: {
        clientInfo: 'Client Information',
        eventDetails: 'Event Details',
        packageSeason: 'Package and Season',
        additionalServices: 'Additional Services',
        discount: 'Discount'
      },
      eventDetails: {
        honoree: 'Honoree',
        honoreePlaceholder: 'Ex: María López, Juan Pérez',
        honoreeHelp: 'Name of the person honored at the event (optional)',
        eventType: 'Event Type',
        eventTypeHelp: 'Select the event type for this offer',
        eventLocation: 'Event Location',
        selectLocation: 'Select a location',
        externalVenue: 'Other (External Venue - No hall charge)',
        maxCapacity: 'Maximum capacity',
        guests: 'guests',
        numberOfGuests: 'Number of Guests',
        numberOfGuestsPlaceholder: 'Ex: 50',
        additionalGuests: 'Additional Guests',
        startTime: 'Start Time',
        endTime: 'End Time',
        hour: 'Hour',
        minutes: 'Minutes',
        selectDateFirst: 'First select the location and event date',
        maxTimeAllowed: 'Maximum allowed: 2:00 AM (legal restriction)',
        eventDuration: 'Event Duration',
        salonAvailable: '✓ The venue is available at this time',
        filtersBySalon: 'Filters by Venue'
      },
      packageSeason: {
        title: 'Package and Season',
        package: 'Package',
        packageRequired: 'Package *',
        selectPackage: 'Select package...',
        specialPackageNote: 'The "Special" package is only available between 10:00 AM and 5:00 PM',
        season: 'Season',
        highSeason: 'High Season',
        adjustment: 'Adjustment',
        autoDetected: 'Auto-detected based on event date'
      },
      additionalServices: {
        title: 'Additional Services',
        add: 'Add',
        perPerson: 'per person',
        alreadyIncluded: 'Already included in package',
        upgradeAvailable: 'Upgrade available from package',
        required: 'REQUIRED!',
        addHours: 'Add',
        hours: 'hours',
        hour: 'hour',
        nextDay: '(next day)',
        maxUntil: 'Maximum until 2 AM',
        categories: {
          bebidas: 'Beverages',
          comida: 'Food',
          decoracion: 'Decoration',
          entretenimiento: 'Entertainment',
          equipos: 'Equipment',
          extras: 'Extras',
          fotografia: 'Photography',
          personal: 'Staff',
          transporte: 'Transportation',
          utensilios: 'Utensils'
        }
      },
      discount: {
        title: 'Discount',
        discountAmount: 'Discount ($)',
        maxDiscountAllowed: 'Maximum discount allowed',
        serviceFee: 'Service Fee (%)',
        serviceFeeHelp: 'Service Fee percentage (15% - 18%). Default'
      },
      eventTypes: {
        wedding: 'Wedding',
        quinceanera: 'Quinceañera',
        birthday: 'Birthday',
        anniversary: 'Anniversary',
        corporate: 'Corporate',
        graduation: 'Graduation',
        babyShower: 'Baby Shower',
        kidsParty: 'Kids Party',
        sweet16: 'Sweet 16',
        other: 'Other'
      }
    },
    
    // Contracts
    contracts: {
      title: 'Contracts',
      contractCode: 'Contract Code',
      status: 'Status',
      paymentStatus: 'Payment Status',
      client: 'Client',
      eventDate: 'Event Date',
      total: 'Total',
      downloadContract: 'Download Contract',
      downloadInvoice: 'Download Invoice',
      viewDetails: 'View Details',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      paid: 'Paid',
      pending: 'Pending',
      partial: 'Partial',
      loading: 'Loading contracts...',
      noContracts: 'No registered contracts',
      search: 'Search contract...',
      filterByStatus: 'Filter by status',
      filterByMonth: 'Filter by month',
      allStatuses: 'All statuses'
    },
    
    // Common forms
    forms: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      search: 'Search...',
      select: 'Select...',
      loading: 'Loading...',
      required: 'This field is required',
      invalidEmail: 'Invalid email',
      invalidPhone: 'Invalid phone',
      saveChanges: 'Save Changes',
      discardChanges: 'Discard Changes',
      confirm: 'Confirm',
      close: 'Close'
    },
    
    // Error/success messages
    messages: {
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      confirmDelete: 'Are you sure you want to delete this?',
      operationSuccess: 'Operation completed successfully',
      operationError: 'Error completing operation',
      deleteSuccess: 'Deleted successfully',
      deleteError: 'Error deleting',
      saveSuccess: 'Saved successfully',
      saveError: 'Error saving'
    },
    
    // Calendar
    calendar: {
      title: 'Calendar',
      month: 'Month',
      year: 'Year',
      today: 'Today',
      noEvents: 'No scheduled events',
      previousMonth: 'Previous Month',
      nextMonth: 'Next Month',
      summary: 'Summary of'
    },
    
    // Leaks/Leads
    leaks: {
      title: 'Leads',
      description: 'Manage potential clients from your campaigns',
      available: 'Available',
      viewAvailable: 'View Available',
      myLeads: 'My Leads',
      viewMyLeads: 'View My Leads',
      assign: 'Assign',
      contact: 'Contact',
      status: 'Status',
      new: 'New',
      interested: 'Interested',
      contacted: 'Contacted',
      contactLater: 'Contacted Call Later',
      noAnswer: 'No Answer Call Later',
      notInterested: 'Contacted Not Interested',
      pendingContact: 'Pending Contact',
      loading: 'Loading leads...',
      noLeads: 'No leads available'
    },
    
    // Commissions
    commissions: {
      title: 'Commissions',
      total: 'Total Commissions',
      monthly: 'Monthly Commissions',
      percentage: 'Commission Percentage',
      sales: 'Sales',
      commission: 'Commission',
      loading: 'Loading commissions...',
      noCommissions: 'No registered commissions'
    },
    // Eventos
    eventos: {
      title: 'Event Management',
      description: 'Manage your active events and client requests'
    },
    // Configuración
    configuracion: {
      title: 'Settings'
    },
    
    // Login
    login: {
      title: 'Login',
      email: 'Code',
      password: 'Password',
      login: 'Log In',
      loading: 'Logging in...',
      error: 'Login error',
      invalidCredentials: 'Invalid credentials'
    },
    
    // Settings
    settings: {
      title: 'Settings',
      profile: 'Profile',
      preferences: 'Preferences',
      language: 'Language',
      save: 'Save Changes',
      saved: 'Changes saved successfully'
    },

    // Toast Messages - Success
    toast: {
      success: {
        clientCreated: 'Client created successfully',
        clientUpdated: 'Client updated successfully',
        clientDeleted: 'Client deleted successfully',
        offerCreated: 'Offer created successfully',
        offerUpdated: 'Offer updated successfully',
        offerDeleted: 'Offer deleted successfully',
        offerRejected: 'Offer rejected',
        contractCreated: 'Contract created successfully!',
        contractUpdated: 'Contract updated successfully',
        statusUpdated: 'Status updated successfully',
        googleCalendarConnected: 'Google Calendar connected successfully',
        googleCalendarDisconnected: 'Google Calendar disconnected successfully',
        changesSaved: 'Changes saved successfully',
        leadAssigned: 'Lead assigned successfully',
        leadStatusUpdated: 'Lead status updated successfully',
        settingsSaved: 'Settings saved successfully',
        pdfDownloaded: 'PDF downloaded successfully',
        emailSent: 'Email sent successfully'
      },
      error: {
        general: 'An error occurred',
        clientCreate: 'Error creating client',
        clientUpdate: 'Error updating client',
        clientDelete: 'Error deleting client',
        offerCreate: 'Error creating offer',
        offerUpdate: 'Error updating offer',
        offerDelete: 'Error deleting offer',
        contractCreate: 'Error creating contract',
        contractUpdate: 'Error updating contract',
        statusUpdate: 'Error updating status',
        googleCalendarConnect: 'Error connecting Google Calendar',
        googleCalendarDisconnect: 'Error disconnecting Google Calendar',
        saveChanges: 'Error saving changes',
        leadAssign: 'Error assigning lead',
        leadStatusUpdate: 'Error updating lead status',
        settingsSave: 'Error saving settings',
        pdfDownload: 'Error downloading PDF',
        pdfGenerate: 'Error generating PDF',
        emailSend: 'Error sending email',
        loadData: 'Error loading data',
        invalidData: 'Invalid data',
        requiredFields: 'Please fill in all required fields',
        unauthorized: 'You are not authorized to perform this action',
        networkError: 'Network error. Please check your connection'
      },
      warning: {
        unsavedChanges: 'You have unsaved changes',
        confirmDelete: 'Are you sure you want to delete this?',
        cannotUndo: 'This action cannot be undone',
        limitReached: 'You have reached the limit',
        checkData: 'Please check the entered data'
      }
    },

    // Validation Messages
    validation: {
      required: {
        field: 'This field is required',
        clientName: 'Client name is required',
        email: 'Email is required',
        phone: 'Phone is required',
        eventType: 'Event type is required',
        eventDate: 'Event date is required',
        eventLocation: 'Event location is required',
        numberOfGuests: 'Number of guests is required',
        package: 'Package is required',
        viewDate: 'View date is required',
        notInterestedReason: 'Reason for not being interested is required',
        contactLaterDate: 'Date to contact again is required',
        startTime: 'Start time is required',
        endTime: 'End time is required'
      },
      invalid: {
        email: 'Invalid email',
        phone: 'Invalid phone',
        date: 'Invalid date',
        time: 'Invalid time',
        number: 'Invalid number',
        url: 'Invalid URL'
      },
      timeConflict: {
        hoursNotAvailable: 'The selected hours are not available. There is already an event scheduled at that time.',
        salonNotAvailable: 'The venue is not available for the selected date and time',
        selectDifferentTime: 'Please select a different time'
      }
    },

    // Loading States
    loading: {
      general: 'Loading...',
      clients: 'Loading clients...',
      client: 'Loading client...',
      offers: 'Loading offers...',
      offer: 'Loading offer...',
      contracts: 'Loading contracts...',
      contract: 'Loading contract...',
      leads: 'Loading leads...',
      commissions: 'Loading commissions...',
      calendar: 'Loading calendar...',
      statistics: 'Loading statistics...',
      settings: 'Loading settings...',
      profile: 'Loading profile...',
      venues: 'Loading venues...',
      packages: 'Loading packages...',
      services: 'Loading services...',
      contractDetails: 'Loading contract details...',
      gallery: 'Loading gallery...',
      photos: 'Loading photos...',
      saving: 'Saving...',
      deleting: 'Deleting...',
      updating: 'Updating...',
      creating: 'Creating...',
      processing: 'Processing...',
      downloading: 'Downloading...',
      uploading: 'Uploading...',
      connecting: 'Connecting...'
    },

    // Google Calendar
    googleCalendar: {
      title: 'Google Calendar',
      connect: 'Connect Google Calendar',
      disconnect: 'Disconnect Google Calendar',
      connected: 'Connected',
      notConnected: 'Not connected',
      sync: 'Sync with Google Calendar',
      syncing: 'Syncing...',
      lastSync: 'Last sync',
      connectSuccess: 'Google Calendar connected successfully',
      disconnectSuccess: 'Google Calendar disconnected successfully',
      syncSuccess: 'Synced successfully',
      connectError: 'Error connecting Google Calendar',
      disconnectError: 'Error disconnecting Google Calendar',
      syncError: 'Error syncing',
      confirmDisconnect: 'Are you sure you want to disconnect your Google Calendar account?',
      errors: {
        missingParams: 'Missing parameters in Google response',
        invalidState: 'Invalid request',
        vendedorNotFound: 'Seller not found',
        accessDenied: 'Access denied by user'
      }
    },

    // Lead Status Updates
    leadStatus: {
      updateSuccess: 'Lead status updated successfully',
      updateError: 'Error updating lead status',
      assignSuccess: 'Lead assigned successfully',
      assignError: 'Error assigning lead',
      contactSuccess: 'Lead contacted successfully',
      contactError: 'Error contacting lead',
      convertedToClient: 'Lead converted to client successfully',
      rateLimitError: 'Too many requests. The system will pause automatically. Please wait a moment.'
    },

    // Gallery/Photos
    gallery: {
      title: 'Gallery',
      photos: 'Photos',
      uploadPhoto: 'Upload Photo',
      deletePhoto: 'Delete Photo',
      viewPhoto: 'View Photo',
      noPhotos: 'No photos available',
      uploadSuccess: 'Photo uploaded successfully',
      uploadError: 'Error uploading photo',
      deleteSuccess: 'Photo deleted successfully',
      deleteError: 'Error deleting photo',
      loading: 'Loading',
      loadingError: 'Error loading'
    },

    // Special Validations
    specialValidation: {
      specialPackageTimeRestriction: 'The "Special" package is only available between 10:00 AM and 5:00 PM. Please select another package.',
      hoursNotAvailableNewVenue: 'The selected hours are not available at the new venue. Please select different hours.',
      minAdditionalGuests: 'You must add at least 1 additional guest',
      maxGuestsExceeded: 'The number of guests cannot exceed 500',
      selectService: 'Select a service',
      serviceQuantityMin: 'The service quantity must be at least 1',
      calculatedCostMinimum: 'The calculated cost must be greater than $0',
      venueMaxCapacity: (max, current, requested, total, available) =>
        `The venue's maximum capacity is ${max} guests\n\n` +
        `Current guests: ${current}\n` +
        `Requested guests: ${requested}\n` +
        `Total: ${total}\n\n` +
        `You can only request up to ${available} additional guest(s).`
    },

    // Notes and changes
    notes: {
      saved: 'Notes saved successfully',
      requestSent: 'Request sent successfully'
    },

    // Dashboard
    dashboardErrors: {
      loadError: 'Error loading dashboard',
      summaryLoadError: 'Error loading summary'
    },

    // Login messages
    auth: {
      loginSuccess: 'Login successful',
      loginError: 'Login error'
    },

    // Sellers (Manager)
    sellers: {
      created: 'Seller created successfully',
      updated: 'Seller updated successfully',
      passwordUpdated: 'Password updated successfully',
      statusChangeError: 'Error changing seller status',
      createError: 'Error creating seller',
      updateError: 'Error updating seller',
      passwordUpdateError: 'Error changing password',
      activated: 'Seller activated',
      deactivated: 'Seller deactivated'
    },

    // Checklist
    checklist: {
      updated: 'Checklist updated successfully'
    }
  }
};

export default translations;

