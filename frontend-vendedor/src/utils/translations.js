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
      email: 'Email',
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
      email: 'Email',
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
    }
  }
};

export default translations;

