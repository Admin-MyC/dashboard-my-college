# Guía de Despliegue: My College (GitHub + Vercel + MongoDB Atlas + Render)

Esta guía describe paso a paso cómo publicar el proyecto en producción para atender más de 100 colegios e instituciones con persistencia en MongoDB.

---

## 1. Subir el proyecto a GitHub

En tu terminal local dentro de la carpeta del proyecto:

```bash
# 1. Inicializar git si no lo has hecho
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el commit inicial
git commit -m "feat: plataforma My College con backend Node.js, Express y MongoDB Atlas"

# 4. Crear tu repositorio en github.com (ej. https://github.com/tu-usuario/my-college.git)
git remote add origin https://github.com/tu-usuario/my-college.git
git branch -M main

# 5. Subir a GitHub
git push -u origin main
```

---

## 2. Configurar MongoDB Atlas

1. Entra a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) y crea tu clúster (el plan M0 gratuito es ideal para empezar).
2. En **Database Access**: crea un usuario con permisos de lectura y escritura (ej. `mycollege_admin`).
3. En **Network Access**: agrega la IP `0.0.0.0/0` para permitir conexiones desde la nube.
4. En **Database > Connect > Drivers**: copia tu cadena de conexión:
   ```text
   mongodb+srv://mycollege_admin:<TU_PASSWORD>@cluster0.abcde.mongodb.net/mycollege_db?retryWrites=true&w=majority
   ```

---

## 3. Despliegue en Vercel (Frontend con Dominio Principal)

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **Add New Project** e importa tu repositorio `my-college`.
3. Vercel detectará automáticamente que es un proyecto **Vite / React**.
4. Haz clic en **Deploy**.
5. Para conectar tu propio dominio:
   - Ve a **Settings > Domains** en tu proyecto de Vercel.
   - Agrega tu dominio (ejemplo: `miplataformaescolar.com`).
   - Sigue las instrucciones de DNS de Vercel (apuntar un registro CNAME o A).

---

## 4. Despliegue del Backend (Render.com / Servidor Node.js)

Para que el backend procese las peticiones a MongoDB:
1. Ve a [render.com](https://render.com) e inicia sesión con GitHub.
2. Haz clic en **New > Web Service**.
3. Selecciona tu repositorio de GitHub `my-college`.
4. Configura los siguientes campos:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start` (o `node dist/server.js` / `npx tsx server.ts`)
5. En **Environment Variables**:
   - `MONGODB_URI`: Tu URL de MongoDB Atlas.
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (o el asignado por Render)
6. Haz clic en **Create Web Service**.

¡Listo! Al conectarse, la base de datos se sembrará automáticamente con los colegios iniciales y mantendrá sincronizados todos los cambios en tiempo real.
