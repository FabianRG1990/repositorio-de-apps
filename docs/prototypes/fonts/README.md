# Inter Variable — subset latino para los prototipos

`InterVariable-latin.woff2` (87 544 B) es el binario oficial de **Inter 4.1**
(`web/InterVariable.woff2` dentro de `Inter-4.1.zip`, 352 240 B), subseteado al
rango `latin` con el juego de características que necesita el taller.

## Por qué no se carga desde Google Fonts

La investigación
[`docs/research/taller/acabado-visual-listas-densas.md`](../../research/taller/acabado-visual-listas-densas.md)
§6.3 comparó la tabla `GSUB` de las dos versiones: **el archivo que sirve
`fonts.gstatic.com` no trae `zero`, `ss02`, `cv05`, `cv08` ni `case`**. Sin
`zero` no hay cero cortado, que es la razón por la que #18 §6.1 eligió Inter —
esta app muestra placas, VIN y números de parte, donde confundir `0` con `O` es
un error de trabajo real.

Además, `css2?family=Inter:wght@400;500;600;700` devuelve cuatro `@font-face`
con `font-weight` de **valor único**, y CSS Fonts 4 §7.2 recorta el peso pedido
al descriptor del `@font-face`: con esa carga, `font-weight: 590` se convierte
en `400` en silencio. Por eso el `@font-face` de acá declara el **rango**
`100 900`.

Y el proyecto es una PWA offline-first: un CDN de terceros no es una
dependencia aceptable.

## Cómo se regenera

```sh
curl -sL -o Inter-4.1.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip
unzip -p Inter-4.1.zip web/InterVariable.woff2 > InterVariable.woff2

python -m fontTools.subset InterVariable.woff2 \
  --output-file=InterVariable-latin.woff2 \
  --flavor=woff2 \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --layout-features="calt,ccmp,locl,kern,mark,mkmk,tnum,zero,case,ss02,ss04,cv05,cv08,cv10,frac,sups,subs,sinf,numr,dnom"
```

Con `fontTools 4.63.0` el resultado es reproducible byte a byte: **87 544 B**,
571 glifos, ejes `wght 100–900` y `opsz 14–32` intactos.

## Licencia

Inter se distribuye bajo la **SIL Open Font License 1.1**; el texto completo
está en [`OFL.txt`](./OFL.txt), tal como viene en el release oficial.
