#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corregir la codificación de mensajes de commit
Se usa como filtro para git-filter-repo
"""

import sys

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

def fix_commit_message(message):
    """
    Corrige los caracteres mal codificados en el mensaje del commit.
    """
    if not message:
        return message
    
    # Aplicar todas las correcciones
    fixed_message = message
    for wrong, correct in CORRECTIONS.items():
        fixed_message = fixed_message.replace(wrong, correct)
    
    return fixed_message

if __name__ == '__main__':
    # Leer el mensaje desde stdin (git-filter-repo lo pasa así)
    message = sys.stdin.read()
    fixed = fix_commit_message(message)
    sys.stdout.write(fixed)
