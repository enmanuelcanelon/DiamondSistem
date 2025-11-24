#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corregir la codificación de mensajes de commit usando git-filter-repo
Usa la API de Python directamente
"""

import sys
from git_filter_repo import RepoFilter

# Diccionario de correcciones de codificación
CORRECTIONS = {
    'ActualizaciÃ³n': 'Actualización',
    'diseÃ±o': 'diseño',
    'cÃ³digo': 'código',
    'pÃ¡ginas': 'páginas',
    'estÃ¡ticos': 'estáticos',
    'salÃ³n': 'salón',
    'salÃ³nes': 'salones',
    'tÃ­tulos': 'títulos',
    'mÃºltiples': 'múltiples',
    'ConsolidaciÃ³n': 'Consolidación',
    'OptimizaciÃ³n': 'Optimización',
    'EliminaciÃ³n': 'Eliminación',
    'correcciÃ³n': 'corrección',
    'cachÃ©': 'caché',
    'pÃ¡gina': 'página',
    'reorganizaciÃ³n': 'reorganización',
    'alineaciÃ³n': 'alineación',
    'hacÃ­a': 'hacía',
}

def message_callback(message, metadata):
    """
    Callback para git-filter-repo que corrige el mensaje del commit.
    """
    if not message:
        return message
    
    # Aplicar todas las correcciones
    fixed_message = message
    for wrong, correct in CORRECTIONS.items():
        fixed_message = fixed_message.replace(wrong, correct)
    
    return fixed_message

if __name__ == '__main__':
    print("Iniciando corrección de mensajes de commit...")
    print("Esto puede tardar varios minutos...")
    print("")
    
    # Crear el filtro con nuestro callback
    # git-filter-repo espera los argumentos como sys.argv
    import sys as sys_module
    original_argv = sys_module.argv[:]
    sys_module.argv = ['git-filter-repo', '--force']
    
    try:
        # Crear args como lista
        args = ['--force']
        filter_repo = RepoFilter(
            args,
            message_callback=message_callback
        )
        
        # Ejecutar el filtro
        filter_repo.run()
        
        print("")
        print("¡Proceso completado exitosamente!")
        print("")
        print("Verifica los commits con: git log --oneline -10")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        sys_module.argv = original_argv

