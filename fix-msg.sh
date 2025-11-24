#!/bin/sh
# Script simple para corregir mensajes de commit
# Lee desde stdin y escribe a stdout

sed -e 's/ActualizaciÃ³n/Actualización/g' \
    -e 's/diseÃ±o/diseño/g' \
    -e 's/cÃ³digo/código/g' \
    -e 's/pÃ¡ginas/páginas/g' \
    -e 's/estÃ¡ticos/estáticos/g' \
    -e 's/salÃ³n/salón/g' \
    -e 's/salÃ³nes/salones/g' \
    -e 's/tÃ­tulos/títulos/g' \
    -e 's/mÃºltiples/múltiples/g' \
    -e 's/ConsolidaciÃ³n/Consolidación/g' \
    -e 's/OptimizaciÃ³n/Optimización/g' \
    -e 's/EliminaciÃ³n/Eliminación/g' \
    -e 's/correcciÃ³n/corrección/g' \
    -e 's/cachÃ©/caché/g' \
    -e 's/pÃ¡gina/página/g' \
    -e 's/reorganizaciÃ³n/reorganización/g' \
    -e 's/alineaciÃ³n/alineación/g' \
    -e 's/hacÃ­a/hacía/g'

