from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
import secrets
import random
import string
from flask_jwt_extended import create_access_token, get_jwt_identity
from flask import make_response
from math import pow

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas y dominios

verification_codes = {}  # Diccionario para almacenar los códigos

# Configuración de claves secretas para Flask y JWT
app.config['SECRET_KEY'] = secrets.token_urlsafe(16)  # Clave para Flask (session)
app.config['JWT_SECRET_KEY'] = secrets.token_urlsafe(32)  # Clave para JWT
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15)  # 15 minutos

# Configuración de Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Cambia esto según tu servidor de correo
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'fianzastt@gmail.com'  # Tu correo electrónico
app.config['MAIL_PASSWORD'] = 'xbak zamo nzri thaj'  # Tu contraseña
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False

# Inicializar Mail y JWT
mail = Mail(app)
jwt = JWTManager(app)

# Serializador para la creación de tokens de verificación de email
s = URLSafeTimedSerializer(app.config['SECRET_KEY'])

def jwt_refresh_if_active(fn):
    @jwt_required()  # Requiere un token válido
    def wrapper(*args, **kwargs):
        # Ejecutar la función original del endpoint
        response = fn(*args, **kwargs)
        
        # Obtener la identidad actual
        current_user = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user)
        
        # Si la respuesta es una tupla, separa sus componentes
        if isinstance(response, tuple):
            data = response[0]  # Contenido de la respuesta
            status_code = response[1] if len(response) > 1 else 200
            headers = response[2] if len(response) > 2 else {}
        else:
            data = response
            status_code = 200
            headers = {}

        # Agregar el nuevo token al encabezado
        headers["Authorization"] = f"Bearer {new_access_token}"
        
        # Usar make_response para crear la respuesta completa
        return make_response(data, status_code, headers)
    return wrapper

def create_connection():
    connection = None
    try:
        connection = mysql.connector.connect(
            host='junction.proxy.rlwy.net',  
            user='root',  
            password='seGINyodjSJtCdGANdxoshXTJKuQNOAV',  
            database='railway',  
            port='46796'
        )
        return connection
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None



@app.route('/api/login', methods=['POST'])
def login():
    from datetime import timedelta
    from dateutil.relativedelta import relativedelta

    data = request.json
    email = data.get('email')
    password = data.get('password')

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Verificar si el usuario existe y las credenciales son correctas
    query_user = "SELECT * FROM Usuario WHERE Email = %s AND Contraseña = %s"
    cursor.execute(query_user, (email, password))
    user = cursor.fetchone()

    if user:
        # Verificar que el usuario esté activo y haya verificado su correo
        if user['Estado_ID'] != 1:
            connection.close()
            return jsonify({"error": "Tu cuenta no está activa. Contacta al soporte."}), 403

        if not user.get('email_verificado', False):
            connection.close()
            return jsonify({"error": "Debes verificar tu correo electrónico para iniciar sesión."}), 403

        # Obtener el ID del usuario
        user_id = user['ID_Usuario']
        print(f"ID del usuario: {user_id}")

        # Crear token de acceso JWT
        access_token = create_access_token(identity=user_id)

        # Inicializar variables para los grupos
        pertenece_a_grupo = False
        es_admin_grupo = False
        grupos_administrados = []
        grupos_pertenecientes = []

        # Verificar si el usuario tiene metas
        cursor.execute("SELECT COUNT(*) AS total FROM Metas WHERE ID_Usuario = %s", (user_id,))
        has_metas = cursor.fetchone()['total'] > 0

        # Verificar si el usuario tiene ahorros
        cursor.execute("SELECT COUNT(*) AS total FROM Ahorro1 WHERE ID_Usuario = %s", (user_id,))
        has_ahorros = cursor.fetchone()['total'] > 0

        # Verificar si el usuario tiene deudas
        cursor.execute("SELECT COUNT(*) AS total FROM Deuda WHERE ID_Usuario = %s", (user_id,))
        has_deudas = cursor.fetchone()['total'] > 0

        # Verificar si el usuario tiene deudas
        cursor.execute("SELECT COUNT(*) AS total FROM Deuda WHERE ID_Usuario = %s", (user_id,))
        has_deudas = cursor.fetchone()['total'] > 0

        # Verificar cuotas próximas a vencer
        query_cuotas = """
            SELECT c.ID_Deuda_Cuota, c.ID_Deuda, c.Cuota, c.Fecha_Limite, d.Descripcion AS Descripcion_Deuda
            FROM Deuda_Cuota c
            INNER JOIN Deuda d ON c.ID_Deuda = d.ID_Deuda
            WHERE c.Estado = 'Pendiente' AND d.ID_Usuario = %s
            ORDER BY c.Fecha_Limite ASC
        """
        cursor.execute(query_cuotas, (user_id,))
        cuotas_pendientes = cursor.fetchall()

        cuotas_proximas = []  # Lista para cuotas con fecha límite próxima
        bandera_cuotas_proximas = False  # Bandera para indicar si hay cuotas próximas a vencer
        fecha_actual = datetime.now().date()  # Fecha actual

        # Procesar cuotas y calcular días restantes
        for cuota in cuotas_pendientes:
            fecha_limite = cuota['Fecha_Limite']
            dias_restantes = (fecha_limite - fecha_actual).days
            cuota['Dias_Restantes'] = dias_restantes

            # Verificar si está dentro de los 3 días previos a la fecha límite
            if 0 <= dias_restantes <= 3:
                bandera_cuotas_proximas = True
                cuotas_proximas.append(cuota)

            # Print para depurar
            print(f"Cuota ID: {cuota['ID_Deuda_Cuota']}, Días restantes: {dias_restantes}")


        # Verificar si es administrador de algún grupo
        cursor.execute("SELECT ID_Grupo, Nombre_Grupo FROM Grupo WHERE ID_Admin = %s", (user_id,))
        grupos_admin = cursor.fetchall()
        if grupos_admin:
            es_admin_grupo = True
            grupos_administrados = grupos_admin

        # Verificar si es miembro de algún grupo
        cursor.execute("""
            SELECT g.ID_Grupo, g.Nombre_Grupo 
            FROM Grupo g
            JOIN Miembro_Grupo mg ON g.ID_Grupo = mg.ID_Grupo
            WHERE mg.ID_Usuario = %s OR mg.Email = %s
        """, (user_id, email))
        grupos_miembro = cursor.fetchall()
        if grupos_miembro:
            pertenece_a_grupo = True
            grupos_pertenecientes = grupos_miembro

        # Verificar si el usuario tiene ingresos registrados
        query_income = """
        SELECT ID_Ingreso, Descripcion, Monto, Fecha, Periodicidad, EsFijo, EsPeriodico 
        FROM Ingreso 
        WHERE ID_Usuario = %s
        """
        cursor.execute(query_income, (user_id,))
        incomes = cursor.fetchall()

        hasIncome = bool(incomes)
        mostrar_tab_periodo = False
        mostrar_tab_periodo_fijos = False
        descripcion_no_fijo = None
        descripcion_fijo = None
        monto_no_fijo = None
        monto_fijo = None
        fecha_ultimo_ingreso_no_fijo = None
        fecha_ultimo_ingreso_fijo = None
        fecha_termino_periodo_no_fijo = None
        fecha_termino_periodo_fijo = None

        if hasIncome:
            print(f"El usuario tiene {len(incomes)} ingresos registrados.")

            # Procesar ingresos no fijos periódicos
            ingresos_no_fijos_periodicos = [
                income for income in incomes if income['EsFijo'] == 0 and income['EsPeriodico'] == 1
            ]
            ingresos_no_fijos_por_descripcion = {}
            for income in ingresos_no_fijos_periodicos:
                desc = income['Descripcion']
                if desc not in ingresos_no_fijos_por_descripcion or income['Fecha'] > ingresos_no_fijos_por_descripcion[desc]['Fecha']:
                    ingresos_no_fijos_por_descripcion[desc] = income

            for desc, income in ingresos_no_fijos_por_descripcion.items():
                print(f"Validando ingreso no fijo periódico: {income}")
                fecha_ultimo_ingreso_no_fijo = income['Fecha']
                monto_no_fijo = income['Monto']
                periodicidad = income['Periodicidad']

                # Calcular la fecha de comparación según la periodicidad
                if periodicidad == 'Diario':
                    fecha_termino_periodo_no_fijo = fecha_ultimo_ingreso_no_fijo + timedelta(days=1)
                elif periodicidad == 'Semanal':
                    fecha_termino_periodo_no_fijo = fecha_ultimo_ingreso_no_fijo + timedelta(weeks=1)
                elif periodicidad == 'Quincenal':
                    fecha_termino_periodo_no_fijo = fecha_ultimo_ingreso_no_fijo + timedelta(weeks=2)
                elif periodicidad == 'Mensual':
                    fecha_termino_periodo_no_fijo = fecha_ultimo_ingreso_no_fijo + relativedelta(months=1)

                print(f"Fecha límite para el ingreso no fijo: {fecha_termino_periodo_no_fijo}")
                if datetime.now().date() >= fecha_termino_periodo_no_fijo:
                    mostrar_tab_periodo = True
                    descripcion_no_fijo = income['Descripcion']
                    break

            # Procesar ingresos fijos periódicos
            ingresos_fijos = [income for income in incomes if income['EsFijo'] == 1 and income['EsPeriodico'] == 1]
            ingresos_fijos_por_descripcion = {}
            for income in ingresos_fijos:
                desc = income['Descripcion']
                if desc not in ingresos_fijos_por_descripcion or income['Fecha'] > ingresos_fijos_por_descripcion[desc]['Fecha']:
                    ingresos_fijos_por_descripcion[desc] = income

            for desc, income in ingresos_fijos_por_descripcion.items():
                print(f"Validando ingreso fijo periódico: {income}")
                fecha_ultimo_ingreso_fijo = income['Fecha']
                monto_fijo = income['Monto']
                periodicidad = income['Periodicidad']

                # Calcular la fecha de comparación según la periodicidad
                if periodicidad == 'Diario':
                    fecha_termino_periodo_fijo = fecha_ultimo_ingreso_fijo + timedelta(days=1)
                elif periodicidad == 'Semanal':
                    fecha_termino_periodo_fijo = fecha_ultimo_ingreso_fijo + timedelta(weeks=1)
                elif periodicidad == 'Quincenal':
                    fecha_termino_periodo_fijo = fecha_ultimo_ingreso_fijo + timedelta(weeks=2)
                elif periodicidad == 'Mensual':
                    fecha_termino_periodo_fijo = fecha_ultimo_ingreso_fijo + relativedelta(months=1)

                print(f"Fecha límite para el ingreso fijo: {fecha_termino_periodo_fijo}")
                if datetime.now().date() >= fecha_termino_periodo_fijo:
                    mostrar_tab_periodo_fijos = True
                    descripcion_fijo = income['Descripcion']
                    break

        connection.close()

        # Generar la respuesta final
        response_data = {
            "message": "Login exitoso",
            "token": access_token,
            "user": user,
            "hasIncome": hasIncome,
            "showFloatingTabIncome": mostrar_tab_periodo,
            "showFloatingTabFixedIncome": mostrar_tab_periodo_fijos,
            "descripcionIngresoNoFijo": descripcion_no_fijo,
            "montoIngresoNoFijo": monto_no_fijo,
            "fechaUltimoIngresoNoFijo": fecha_ultimo_ingreso_no_fijo.strftime('%d/%m/%Y') if fecha_ultimo_ingreso_no_fijo else None,
            "fechaTerminoPeriodoNoFijo": fecha_termino_periodo_no_fijo.strftime('%d/%m/%Y') if fecha_termino_periodo_no_fijo else None,
            "descripcionIngresoFijo": descripcion_fijo,
            "montoIngresoFijo": monto_fijo,
            "fechaUltimoIngresoFijo": fecha_ultimo_ingreso_fijo.strftime('%d/%m/%Y') if fecha_ultimo_ingreso_fijo else None,
            "fechaTerminoPeriodoFijo": fecha_termino_periodo_fijo.strftime('%d/%m/%Y') if fecha_termino_periodo_fijo else None,
            "showFloatingTab": not hasIncome and not incomes,
            "pertenece_a_grupo": pertenece_a_grupo,
            "es_admin_grupo": es_admin_grupo,
            "grupos_administrados": grupos_administrados,
            "grupos_pertenecientes": grupos_pertenecientes,
            "hasMetas": has_metas,
            "hasAhorros": has_ahorros,
            "hasDeudas": has_deudas,
            "cuotasProximas" : cuotas_proximas,
            "tieneCuotasProximas": bandera_cuotas_proximas,
        }

        return jsonify(response_data), 200
    else:
        connection.close()
        return jsonify({"error": "Correo o contraseña incorrectos"}), 401




def calcular_fecha_periodo(fecha, periodicidad):
    """
    Calcula la fecha donde terminó el último periodo según la periodicidad.
    """
    if periodicidad == 'Diario':
        return fecha + timedelta(days=1)
    elif periodicidad == 'Semanal':
        return fecha + timedelta(weeks=1)
    elif periodicidad == 'Quincenal':
        return fecha + timedelta(weeks=2)
    elif periodicidad == 'Mensual':
        return fecha + relativedelta(months=1)
    return fecha



@app.route('/api/estado-financiero', methods=['GET'])
@jwt_required()
def estado_financiero():
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)
    
    try:
        # Verificar si el usuario tiene metas
        cursor.execute("SELECT COUNT(*) AS total FROM Metas WHERE ID_Usuario = %s", (user_id,))
        has_metas = cursor.fetchone()['total'] > 0

        # Verificar si el usuario tiene ahorros
        cursor.execute("SELECT COUNT(*) AS total FROM Ahorro1 WHERE ID_Usuario = %s", (user_id,))
        has_ahorros = cursor.fetchone()['total'] > 0

        # Verificar si el usuario tiene deudas
        cursor.execute("SELECT COUNT(*) AS total FROM Deuda WHERE ID_Usuario = %s", (user_id,))
        has_deudas = cursor.fetchone()['total'] > 0

        return jsonify({
            "hasMetas": has_metas,
            "hasAhorros": has_ahorros,
            "hasDeudas": has_deudas
        }), 200

    except Exception as e:
        print(f"Error al verificar estado financiero: {e}")
        return jsonify({"error": "Error al verificar estado financiero"}), 500

    finally:
        connection.close()



# FUNCION DE REGISTRO DE USUARIOS (No protegida)
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    print(f"Datos recibidos para registro: {data}")

    email = data.get('email')
    password = data.get('password')
    nombre = data.get('nombre')
    apellido_p = data.get('apellido_p')
    apellido_m = data.get('apellido_m')
    fecha_cumple = data.get('fecha_cumple')
    contacto = data.get('contacto', None)

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor()

    try:
        # Verificar si el usuario ya existe
        query_check = "SELECT * FROM Usuario WHERE Email = %s"
        cursor.execute(query_check, (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({"error": "El usuario ya existe"}), 409

        # Insertar nuevo usuario con Estado_ID = 1
        query = """
        INSERT INTO Usuario (Nombre, Apellido_P, Apellido_M, Email, Contraseña, Estado_ID, Fecha_Cumple, Contacto)
        VALUES (%s, %s, %s, %s, %s, 1, %s, %s)
        """
        cursor.execute(query, (nombre, apellido_p, apellido_m, email, password, fecha_cumple, contacto))
        connection.commit()

        # Enviar correo de verificación
        token = s.dumps(email, salt='email-confirm')
        confirm_url = url_for('confirm_email', token=token, _external=True)
        
        # Configurar el cuerpo del mensaje en HTML
        html_body = f"""
        <p>Por favor, haz clic <a href="{confirm_url}">AQUI</a> para verificar tu correo electrónico.</p>
        """
        
        msg = Message('Confirma tu correo electrónico', sender='your_email@gmail.com', recipients=[email])
        msg.html = html_body  # Usar el cuerpo en HTML
        mail.send(msg)

        return jsonify({"message": "Usuario registrado exitosamente"}), 201

    except mysql.connector.errors.IntegrityError as e:
        return jsonify({"error": "El usuario ya existe"}), 409

    finally:
        connection.close()



@app.route('/confirm_email/<token>', methods=['GET'])
def confirm_email(token):
    try:
        email = s.loads(token, salt='email-confirm', max_age=3600)
    except SignatureExpired:
        return jsonify({"error": "El enlace de verificación ha expirado."}), 400
    
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor()

    # Actualizar el campo email_verificado a True
    query = "UPDATE Usuario SET email_verificado = TRUE WHERE Email = %s"
    cursor.execute(query, (email,))
    connection.commit()

    connection.close()

    # Enviar una respuesta HTML para ser manejada por React
    return '''
    <html>
        <body>
            <script>
                window.location.href = "http://localhost:3000/";
            </script>
        </body>
    </html>
    ''', 200

@app.route('/api/ingreso', methods=['POST'])
@jwt_refresh_if_active
def agregar_ingreso():
    data = request.json
    id_usuario = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT
    monto = data.get('monto')
    descripcion = data.get('descripcion', None)
    tipo = data.get('tipo', None)
    periodicidad = data.get('periodicidad', None)
    es_fijo = data.get('esFijo', None)
    es_periodico = data.get('es_periodico', True)  # Por defecto, es periódico si no se especifica lo contrario

    # Verificar si se envió una fecha en el payload; si no, usar la fecha actual
    fecha = data.get('fecha', None)
    if fecha:
        try:
            fecha = datetime.strptime(fecha, '%Y-%m-%d').date()  # Convertir la fecha de string a objeto datetime
        except ValueError:
            return jsonify({"error": "Formato de fecha incorrecto. Use YYYY-MM-DD."}), 400
    else:
        fecha = datetime.now().date()  # Usar la fecha actual si no se envió una en el payload

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor()

    # Si el frontend solo envía el monto, buscamos un ingreso existente con la misma descripción
    if descripcion is None or tipo is None:
        # Si solo se recibe el monto, estamos actualizando el ingreso periódico sin cambiar la descripción ni otros datos
        print("Actualización de ingreso con solo monto y fecha estimada del periodo")

        query_find_ingreso = """
        SELECT ID_Ingreso, Descripcion, Tipo, Periodicidad, EsFijo, EsPeriodico, Fecha
        FROM Ingreso
        WHERE ID_Usuario = %s AND Descripcion = %s
        ORDER BY Fecha DESC
        LIMIT 1
        """
        cursor.execute(query_find_ingreso, (id_usuario, data.get('descripcion')))
        ingreso_existente = cursor.fetchone()

        if ingreso_existente:
            # Si encontramos un ingreso anterior, usamos los mismos datos excepto monto y fecha
            descripcion = ingreso_existente[1]
            tipo = ingreso_existente[2]
            periodicidad = ingreso_existente[3]
            es_fijo = ingreso_existente[4]
            es_periodico = ingreso_existente[5]
            fecha_ultimo_ingreso = ingreso_existente[6]

            # Calcular la fecha estimada donde terminó el último periodo
            fecha_termino_periodo = calcular_fecha_periodo(fecha_ultimo_ingreso, periodicidad)

            # Insertamos un nuevo ingreso con la fecha estimada del periodo en lugar de la fecha actual
            query_insert = """
            INSERT INTO Ingreso (Descripcion, Monto, Fecha, Tipo, ID_Usuario, Periodicidad, EsFijo, EsPeriodico)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query_insert, (descripcion, monto, fecha_termino_periodo, tipo, id_usuario, periodicidad, es_fijo, es_periodico))
            connection.commit()

            print(f"Ingreso con fecha estimada del periodo procesado correctamente para {descripcion}")
            connection.close()
            return jsonify({"message": "Ingreso actualizado con éxito"}), 201
        else:
            connection.close()
            return jsonify({"error": "No se encontró un ingreso previo para actualizar"}), 404

    # Si se proporcionan todos los datos, estamos insertando un nuevo ingreso o actualizando uno existente
    else:
        print(f"Datos recibidos para agregar o actualizar ingreso: {data}")
        
        # Verificar si ya existe un ingreso con la misma descripción
        query_check = """
        SELECT ID_Ingreso, Fecha
        FROM Ingreso
        WHERE Descripcion = %s AND ID_Usuario = %s
        ORDER BY Fecha DESC
        LIMIT 1
        """
        cursor.execute(query_check, (descripcion, id_usuario))
        ingreso_existente = cursor.fetchone()

        if ingreso_existente:
            # Comprobar si el periodo ha pasado basándose en la periodicidad
            fecha_ultimo_ingreso = ingreso_existente[1]
            fecha_siguiente_ingreso = calcular_fecha_periodo(fecha_ultimo_ingreso, periodicidad)

            # Si el periodo ha pasado, insertamos un nuevo ingreso
            if fecha >= fecha_siguiente_ingreso:
                query_insert = """
                INSERT INTO Ingreso (Descripcion, Monto, Fecha, Tipo, ID_Usuario, Periodicidad, EsFijo, EsPeriodico)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(query_insert, (descripcion, monto, fecha_siguiente_ingreso, tipo, id_usuario, periodicidad, es_fijo, es_periodico))
                print(f"Ingreso periódico insertado correctamente para {descripcion}")
            else:
                print("El periodo aún no ha pasado, no se actualiza")
                return jsonify({"message": "El periodo aún no ha pasado, no es necesario actualizar el ingreso"}), 200
        else:
            # Insertar un nuevo ingreso
            print(f"Insertando nuevo ingreso para {descripcion}")
            query_insert = """
            INSERT INTO Ingreso (Descripcion, Monto, Fecha, Tipo, ID_Usuario, Periodicidad, EsFijo, EsPeriodico)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query_insert, (descripcion, monto, fecha, tipo, id_usuario, periodicidad, es_fijo, es_periodico))

        connection.commit()
        print(f"Ingreso procesado correctamente para {descripcion}")
        connection.close()

        return jsonify({"message": "Ingreso procesado exitosamente"}), 201


def calcular_fecha_periodo(fecha, periodicidad):
    """
    Calcula la fecha donde terminó el último periodo según la periodicidad.
    """
    if periodicidad == 'Diario':
        return fecha + timedelta(days=1)
    elif periodicidad == 'Semanal':
        return fecha + timedelta(weeks=1)
    elif periodicidad == 'Quincenal':
        return fecha + timedelta(weeks=2)
    elif periodicidad == 'Mensual':
        return fecha + relativedelta(months=1)
    return fecha




# RUTA PARA OBTENER INGRESOS FILTRADOS
@app.route('/api/income/filtered', methods=['POST'], endpoint='filtrar_ingresos')
@jwt_refresh_if_active
def obtener_ingresos_filtrados():
    user_id = get_jwt_identity()  # ID del usuario autenticado
    data = request.json  # Filtros enviados desde el frontend

    # Obtener los filtros
    tipo = data.get('tipo')  # Activo/Pasivo
    es_fijo = data.get('esFijo')  # Fijo o No fijo
    fecha = data.get('fecha')  # Fecha específica
    fecha_inicio = data.get('fecha_inicio')  # Fecha de inicio del rango
    fecha_fin = data.get('fecha_fin')  # Fecha de fin del rango
    periodicidad = data.get('periodicidad')  # Filtro por periodicidad

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Construir la consulta SQL con filtros dinámicos
    query = """
    SELECT 
        ID_Ingreso, 
        Descripcion, 
        Monto, 
        Periodicidad, 
        EsFijo, 
        Tipo, 
        Fecha, 
        EsPeriodico
    FROM Ingreso
    WHERE ID_Usuario = %s
    """
    params = [user_id]

    # Aplicar filtros dinámicamente
    if tipo:
        query += " AND Tipo = %s"
        params.append(tipo)

    if es_fijo:
        if es_fijo == 'fijo':
            query += " AND EsFijo = 1"  # Fijo
        elif es_fijo == 'nofijo':
            query += " AND (EsFijo = 0 OR EsFijo IS NULL)"  # No fijo incluye NULL

    # Filtro por fecha específica
    if fecha:
        query += " AND Fecha = %s"
        params.append(fecha)

    # Filtro por rango de fechas
    if fecha_inicio and fecha_fin:
        query += " AND Fecha BETWEEN %s AND %s"
        params.append(fecha_inicio)
        params.append(fecha_fin)

    # Filtro por periodicidad
    if periodicidad:
        query += " AND Periodicidad = %s"
        params.append(periodicidad)

    query += " ORDER BY Fecha DESC"  # Ordenar por fecha descendente

    try:
        cursor.execute(query, params)
        ingresos_filtrados = cursor.fetchall()  # Obtener los datos filtrados
        connection.close()
        return jsonify(ingresos_filtrados), 200  # Retornar la lista completa de ingresos
    except Exception as e:
        connection.close()
        return jsonify({"error": f"Error al filtrar los ingresos: {str(e)}"}), 500



        

# RUTA PARA OBTENER INGRESOS PARA TABLA
@app.route('/api/user/incomes', methods=['GET'], endpoint='Ingresos_tabla')
@jwt_refresh_if_active
def get_user_incomes():
    user_id = get_jwt_identity()

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)
    query = """
    SELECT ID_Ingreso, Descripcion, Monto, Periodicidad, EsFijo, Tipo, Fecha, EsPeriodico
    FROM Ingreso
    WHERE ID_Usuario = %s
    ORDER BY Fecha DESC
    """
    cursor.execute(query, (user_id,))
    incomes = cursor.fetchall()

    # Mapear el valor de EsPeriodico a "Periódico" o "Único"
    for income in incomes:
        income['TipoPeriodico'] = 'Periódico' if income['EsPeriodico'] else 'Único'

    connection.close()

    return jsonify(incomes), 200


# RUTA PARA ELIMINAR INGRESOS 
@app.route('/api/user/incomes/<int:income_id>', methods=['DELETE'], endpoint='eliminar_ingreso')
@jwt_refresh_if_active
def delete_income(income_id):
    user_id = get_jwt_identity()

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Obtener la información del ingreso antes de eliminarlo
    query_select = "SELECT * FROM Ingreso WHERE ID_Ingreso = %s AND ID_Usuario = %s"
    cursor.execute(query_select, (income_id, user_id))
    income = cursor.fetchone()

    if not income:
        connection.close()
        return jsonify({"error": "Ingreso no encontrado"}), 404

    # Loguear la información del ingreso a eliminar
    print(f"Ingreso a eliminar: {income}")

    # Proceder a eliminar el ingreso
    query_delete = "DELETE FROM Ingreso WHERE ID_Ingreso = %s AND ID_Usuario = %s"
    cursor.execute(query_delete, (income_id, user_id))
    connection.commit()

    connection.close()

    return jsonify({"message": "Ingreso eliminado exitosamente."}), 200


@app.route('/api/user/update_income/<int:id_ingreso>', methods=['PUT'], endpoint='actualizar_ingreso')
@jwt_refresh_if_active
def update_income(id_ingreso):
    user_id = get_jwt_identity()
    data = request.json

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor()

    # Actualizar el ingreso con los nuevos datos, incluyendo la fecha
    query = """
    UPDATE Ingreso
    SET Descripcion = %s, Monto = %s, Periodicidad = %s, EsFijo = %s, Tipo = %s, Fecha = %s
    WHERE ID_Ingreso = %s AND ID_Usuario = %s
    """
    cursor.execute(query, (
        data.get('Descripcion'),
        data.get('Monto'),
        data.get('Periodicidad'),
        data.get('EsFijo'),
        data.get('Tipo'),
        data.get('Fecha'),  # Asegúrate de que la fecha se esté enviando en el formato correcto (YYYY-MM-DD)
        id_ingreso,
        user_id
    ))
    
    connection.commit()
    connection.close()

    return jsonify({"message": "Ingreso actualizado exitosamente."}), 200




@app.route('/api/user/income/<int:id_ingreso>', methods=['GET'], endpoint='obtener_ingreso_act')
@jwt_refresh_if_active
def get_income_by_id(id_ingreso):
    user_id = get_jwt_identity()

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)
    query = """
    SELECT ID_Ingreso, Descripcion, Monto, Periodicidad, EsFijo, Tipo, Fecha, EsPeriodico
    FROM Ingreso
    WHERE ID_Ingreso = %s AND ID_Usuario = %s
    """
    cursor.execute(query, (id_ingreso, user_id))
    income = cursor.fetchone()

    connection.close()

    if income:
        return jsonify(income), 200
    else:
        return jsonify({"error": "Ingreso no encontrado"}), 404
    

@app.route('/api/gasto', methods=['POST'], endpoint='registrar_gasto')
@jwt_refresh_if_active
def agregar_gasto():
    data = request.json
    print("Datos recibidos en el backend para gasto:", data)  # Para verificar el payload en consola

    id_usuario = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT
    descripcion = data.get('descripcion')
    monto = data.get('monto')
    fecha = data.get('fecha', None)
    categoria = data.get('categoria')
    id_subcategoria = data.get('id_subcategoria')  # Asegurarse de que sea un ID
    periodicidad = data.get('periodicidad', None)  # Se espera como None si es único
    periodico = data.get('periodico', 1)  # Por defecto, asumir que es periódico

    # Validación de la fecha, si no está en el payload, se usa la fecha actual
    if fecha:
        try:
            fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Formato de fecha incorrecto. Use YYYY-MM-DD."}), 400
    else:
        fecha = datetime.now().date()

    # Validación de campos obligatorios
    if not descripcion or not monto or not categoria:
        return jsonify({"error": "Datos incompletos"}), 400

    # Configuración de la conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor()

    # Si es único, periodicidad será NULL
    query = """
    INSERT INTO Gasto (Descripcion, Monto, Fecha, Categoria, ID_Subcategoria, Periodico, ID_Usuario, Periodicidad)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (
        descripcion,
        monto,
        fecha,
        categoria,
        id_subcategoria,
        periodico,
        id_usuario,
        periodicidad if periodico == 1 else None  # Almacena periodicidad solo si es periódico
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Gasto registrado con éxito"}), 201





@app.route('/api/user/gastos', methods=['GET'], endpoint='obtener_Gastos')
@jwt_refresh_if_active
def obtener_gastos_usuario():
    id_usuario = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Actualizar la consulta eliminando `G.ID_Grupo`
    query = """
    SELECT G.ID_Gasto, G.Descripcion, G.Monto, G.Fecha, G.Categoria, G.Periodicidad, 
           G.Periodico, S.Nombre AS Subcategoria
    FROM Gasto G
    LEFT JOIN Subcategoria S ON G.ID_Subcategoria = S.ID_Subcategoria
    WHERE G.ID_Usuario = %s
    ORDER BY G.Fecha DESC
    """
    cursor.execute(query, (id_usuario,))
    gastos = cursor.fetchall()

    connection.close()

    # Convertir el resultado en formato JSON
    gastos_json = [
        {
            "ID_Gasto": gasto["ID_Gasto"],
            "Descripcion": gasto["Descripcion"],
            "Monto": gasto["Monto"],
            "Fecha": gasto["Fecha"].strftime('%Y-%m-%d'),  # Formato de fecha para JSON
            "Categoria": gasto["Categoria"],
            "Periodicidad": gasto["Periodicidad"],
            "Periodico": gasto["Periodico"],
            "Subcategoria": gasto["Subcategoria"]  # Añadir el nombre de la subcategoría
        }
        for gasto in gastos
    ]

    return jsonify(gastos_json), 200





@app.route('/api/gasto/<int:id_gasto>', methods=['PUT'], endpoint='actualizar_gasto')
@jwt_refresh_if_active
def actualizar_gasto(id_gasto):
    data = request.json
    id_usuario = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT

    descripcion = data.get('descripcion')
    monto = data.get('monto')
    fecha = data.get('fecha')
    categoria = data.get('categoria')
    periodico = data.get('periodico')
    id_grupo = data.get('id_grupo')

    if not descripcion or not monto or not fecha or not categoria:
        return jsonify({"error": "Datos incompletos"}), 400

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor()

    # Actualizar el gasto existente
    query = """
    UPDATE Gasto
    SET Descripcion = %s, Monto = %s, Fecha = %s, Categoria = %s, Periodico = %s, ID_Grupo = %s
    WHERE ID_Gasto = %s AND ID_Usuario = %s
    """
    cursor.execute(query, (descripcion, monto, fecha, categoria, periodico, id_grupo, id_gasto, id_usuario))

    connection.commit()
    connection.close()

    return jsonify({"message": "Gasto actualizado con éxito"}), 200



@app.route('/api/gasto/<int:id_gasto>', methods=['DELETE'], endpoint='eliminar_gasto')
@jwt_refresh_if_active
def eliminar_gasto(id_gasto):
    id_usuario = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor()

    # Eliminar el gasto
    query = """
    DELETE FROM Gasto WHERE ID_Gasto = %s AND ID_Usuario = %s
    """
    cursor.execute(query, (id_gasto, id_usuario))

    connection.commit()
    connection.close()

    return jsonify({"message": "Gasto eliminado con éxito"}), 200



@app.route('/api/gasto/filtered', methods=['POST'], endpoint='filtrar_gastos')
@jwt_refresh_if_active
def filtrar_gastos_usuario():
    """
    Endpoint para obtener datos de los gastos filtrados según los parámetros proporcionados.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado
    data = request.json  # Filtros enviados desde el frontend

    # Obtener los filtros
    categoria = data.get('categoria', None)
    subcategoria = data.get('subcategoria', None)
    periodicidad = data.get('periodicidad', None)
    periodico = data.get('periodico', None)  # Booleano: 1 (periódico), 0 (único)
    fecha = data.get('fecha', None)  # Fecha específica
    fecha_inicio = data.get('fecha_inicio', None)  # Fecha de inicio del rango
    fecha_fin = data.get('fecha_fin', None)  # Fecha de fin del rango

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Construir la consulta SQL con filtros dinámicos
    query = """
    SELECT 
        G.ID_Gasto, 
        G.Descripcion, 
        G.Monto, 
        G.Fecha, 
        G.Categoria, 
        S.Nombre AS Subcategoria, 
        G.Periodicidad, 
        G.Periodico
    FROM Gasto G
    LEFT JOIN Subcategoria S ON G.ID_Subcategoria = S.ID_Subcategoria
    WHERE G.ID_Usuario = %s
    """
    params = [user_id]

    # Aplicar filtros dinámicamente
    if categoria:
        query += " AND G.Categoria = %s"
        params.append(categoria)

    if subcategoria:
        query += " AND S.Nombre = %s"
        params.append(subcategoria)

    if periodicidad:
        query += " AND G.Periodicidad = %s"
        params.append(periodicidad)

    if periodico is not None:  # Si se envía el filtro, aplicar
        query += " AND G.Periodico = %s"
        params.append(periodico)

    if fecha:
        query += " AND G.Fecha = %s"
        params.append(fecha)

    if fecha_inicio and fecha_fin:
        query += " AND G.Fecha BETWEEN %s AND %s"
        params.append(fecha_inicio)
        params.append(fecha_fin)

    query += " ORDER BY G.Fecha DESC"  # Ordenar por fecha descendente

    try:
        # Ejecutar la consulta
        cursor.execute(query, params)
        gastos_filtrados = cursor.fetchall()

        # Cerrar conexión
        connection.close()

        # Transformar los resultados para JSON
        gastos_json = [
            {
                "ID_Gasto": gasto["ID_Gasto"],
                "Descripcion": gasto["Descripcion"],
                "Monto": gasto["Monto"],
                "Fecha": gasto["Fecha"].strftime('%Y-%m-%d'),
                "Categoria": gasto["Categoria"],
                "Subcategoria": gasto["Subcategoria"] or "N/A",
                "Periodicidad": gasto["Periodicidad"] or "N/A",
                "Periodico": "Periódico" if gasto["Periodico"] else "Único",
            }
            for gasto in gastos_filtrados
        ]

        return jsonify(gastos_json), 200

    except Exception as e:
        connection.close()
        return jsonify({"error": f"Error al filtrar los gastos: {str(e)}"}), 500




@app.route('/api/subcategorias/<string:categoria>', methods=['GET'], endpoint='subcategoria_asto')
@jwt_refresh_if_active
def obtener_subcategorias(categoria):
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Buscar subcategorías según la categoría
    query = "SELECT ID_Subcategoria, Nombre FROM Subcategoria WHERE Categoria = %s"
    cursor.execute(query, (categoria,))
    subcategorias = cursor.fetchall()

    connection.close()

    # Retornar el ID y el Nombre de cada subcategoría
    return jsonify(subcategorias), 200

    # Obtener metas financieras
@app.route('/api/metas', methods=['GET'], endpoint='obtener_metas')
@jwt_refresh_if_active
def obtener_metas():
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor(dictionary=True)
    query_metas = """
        SELECT ID_Meta, Nombre, MontoObjetivo, FechaInicio, FechaTermino, MesesParaMeta, AhorroMensual 
        FROM Metas 
        WHERE ID_Usuario = %s
    """
    cursor.execute(query_metas, (user_id,))
    metas = cursor.fetchall()

    for meta in metas:
        query_ahorrado = """
            SELECT SUM(MontoAhorrado) as MontoAhorrado 
            FROM TransaccionesMeta 
            WHERE ID_Meta = %s
        """
        cursor.execute(query_ahorrado, (meta['ID_Meta'],))
        resultado_ahorrado = cursor.fetchone()
        meta['MontoAhorrado'] = resultado_ahorrado['MontoAhorrado'] if resultado_ahorrado['MontoAhorrado'] is not None else 0

    connection.close()
    return jsonify(metas), 200



#Crear metas
@app.route('/api/metas', methods=['POST'], endpoint='crear_meta')
@jwt_refresh_if_active
def crear_meta():
    user_id = get_jwt_identity()
    data = request.json
    nombre = data.get('nombre')
    monto_objetivo = data.get('montoObjetivo')
    fecha_inicio = data.get('fechaInicio')
    fecha_termino = data.get('fechaTermino')
    meses_para_meta = data.get('mesesParaMeta')
    ahorro_mensual = data.get('ahorroMensual')
    
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor()
    query = """
        INSERT INTO Metas (ID_Usuario, Nombre, MontoObjetivo, FechaInicio, FechaTermino, MesesParaMeta, AhorroMensual)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (user_id, nombre, monto_objetivo, fecha_inicio, fecha_termino, meses_para_meta, ahorro_mensual))
    connection.commit()
    
    connection.close()
    return jsonify({"message": "Meta creada exitosamente"}), 201



@app.route('/api/ahorro', methods=['POST'], endpoint='crear_ahorro')
@jwt_refresh_if_active
def crear_ahorro():
    user_id = get_jwt_identity()
    data = request.json
    descripcion = data.get('descripcion')
    monto_actual = float(data.get('montoActual', 0.0))  # Convertir a float
    fecha_inicio = data.get('fechaInicio')
    tasa_interes = data.get('tasaInteres')
    
    if not all([descripcion, fecha_inicio, tasa_interes]):
        return jsonify({"error": "Datos incompletos"}), 400
    
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    try:
        cursor = connection.cursor()
        
        # Insertar en la tabla Ahorro1
        query_ahorro = """
            INSERT INTO Ahorro1 (Descripcion, Monto_Actual, Fecha_Inicio, Tasa_Interes, ID_Usuario)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query_ahorro, (descripcion, monto_actual, fecha_inicio, tasa_interes, user_id))
        
        # Obtener el ID del ahorro recién insertado
        id_ahorro = cursor.lastrowid

        # Si hay un monto inicial, registrar en la tabla Abono_Ahorro
        if monto_actual > 0:  # Ahora la comparación es válida
            query_abono = """
                INSERT INTO Abono_Ahorro (ID_Ahorro, ID_Usuario, Abono, Fecha_Abono)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query_abono, (id_ahorro, user_id, monto_actual, fecha_inicio))
        
        connection.commit()
        return jsonify({"message": "Meta de ahorro creada exitosamente"}), 201
    
    except Exception as e:
        connection.rollback()
        print(f"Error al crear el ahorro: {e}")
        return jsonify({"error": "Error al registrar el ahorro"}), 500
    
    finally:
        connection.close()

@app.route('/api/ahorros/<int:id_ahorro>', methods=['DELETE'])
@jwt_required()
def eliminar_ahorro(id_ahorro):
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()

        # Verificar si el ahorro pertenece al usuario
        query_check = "SELECT ID_Ahorro FROM Ahorro1 WHERE ID_Ahorro = %s AND ID_Usuario = %s"
        cursor.execute(query_check, (id_ahorro, user_id))
        ahorro = cursor.fetchone()
        if not ahorro:
            return jsonify({"error": "Ahorro no encontrado o no autorizado"}), 404

        # Eliminar el ahorro
        query_delete = "DELETE FROM Ahorro1 WHERE ID_Ahorro = %s"
        cursor.execute(query_delete, (id_ahorro,))
        connection.commit()

        return jsonify({"message": "Ahorro eliminado correctamente"}), 200

    except Exception as e:
        print(f"Error al eliminar el ahorro: {e}")
        return jsonify({"error": "Error al eliminar el ahorro"}), 500

    finally:
        connection.close()



@app.route('/api/ahorros', methods=['GET'], endpoint='obtener_ahorros')
@jwt_refresh_if_active
def obtener_ahorros():
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            SELECT ID_Ahorro, Descripcion, Monto_Actual, Fecha_Inicio, Tasa_Interes, Rendimiento
            FROM Ahorro1
            WHERE ID_Usuario = %s
        """
        cursor.execute(query, (user_id,))
        ahorros = cursor.fetchall()
        connection.close()

        return jsonify(ahorros), 200
    except Exception as e:
        print("Error al obtener ahorros:", e)
        return jsonify({"error": "Error al obtener ahorros"}), 500


    

@app.route('/api/ahorro/<int:id_ahorro>', methods=['GET'], endpoint='obtener_detalle_ahorro')
@jwt_required()
def obtener_detalle_ahorro(id_ahorro):
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Obtener el detalle del ahorro
        query_ahorro = """
            SELECT ID_Ahorro, Descripcion, Monto_Actual, Fecha_Inicio, Tasa_Interes
            FROM Ahorro1
            WHERE ID_Ahorro = %s AND ID_Usuario = %s
        """
        cursor.execute(query_ahorro, (id_ahorro, user_id))
        ahorro = cursor.fetchone()

        if not ahorro:
            return jsonify({"error": "Ahorro no encontrado"}), 404

        # Obtener los abonos relacionados
        query_abonos = """
            SELECT ID_Abono, Abono, Fecha_Abono
            FROM Abono_Ahorro
            WHERE ID_Ahorro = %s
            ORDER BY Fecha_Abono ASC
        """
        cursor.execute(query_abonos, (id_ahorro,))
        abonos = cursor.fetchall()

        # Obtener los retiros relacionados
        query_retiros = """
            SELECT ID_Retiro, Monto_Retirado, Fecha_Retiro
            FROM Retiro_Ahorro
            WHERE ID_Ahorro = %s
            ORDER BY Fecha_Retiro ASC
        """
        cursor.execute(query_retiros, (id_ahorro,))
        retiros = cursor.fetchall()

        ahorro['Abonos'] = abonos
        ahorro['Retiros'] = retiros

        return jsonify(ahorro), 200

    except Exception as e:
        print(f"Error al obtener el detalle del ahorro: {e}")
        return jsonify({"error": "Error al obtener el detalle del ahorro"}), 500

    finally:
        connection.close()



@app.route('/api/ahorro/<int:id_ahorro>/retiros', methods=['POST'], endpoint='registrar_retiro_ahorro')
@jwt_required()
def registrar_retiro_ahorro(id_ahorro):
    user_id = get_jwt_identity()
    data = request.json
    monto_retirado = data.get('montoRetirado')
    fecha_retiro = data.get('fechaRetiro')

    if not monto_retirado or not fecha_retiro:
        return jsonify({"error": "Datos incompletos"}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()

        # Insertar el retiro
        query_retiro = """
            INSERT INTO Retiro_Ahorro (ID_Ahorro, ID_Usuario, Monto_Retirado, Fecha_Retiro)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query_retiro, (id_ahorro, user_id, monto_retirado, fecha_retiro))

        # Actualizar el monto actual del ahorro
        query_actualizar_ahorro = """
            UPDATE Ahorro1
            SET Monto_Actual = Monto_Actual - %s
            WHERE ID_Ahorro = %s AND ID_Usuario = %s
        """
        cursor.execute(query_actualizar_ahorro, (monto_retirado, id_ahorro, user_id))

        connection.commit()
        return jsonify({"message": "Retiro registrado exitosamente"}), 201

    except Exception as e:
        connection.rollback()
        print(f"Error al registrar el retiro: {e}")
        return jsonify({"error": "Error al registrar el retiro"}), 500

    finally:
        connection.close()



@app.route('/api/ahorro/<int:id_ahorro>/abonos', methods=['POST'], endpoint='registrar_abono_ahorro')
@jwt_required()
def registrar_abono_ahorro(id_ahorro):
    user_id = get_jwt_identity()
    data = request.json
    abono = data.get('abono')
    fecha_abono = data.get('fechaAbono')

    if not abono or not fecha_abono:
        return jsonify({"error": "Datos incompletos"}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()

        # Insertar el abono
        query_abono = """
            INSERT INTO Abono_Ahorro (ID_Ahorro, ID_Usuario, Abono, Fecha_Abono)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query_abono, (id_ahorro, user_id, abono, fecha_abono))

        # Actualizar el monto actual del ahorro
        query_actualizar_ahorro = """
            UPDATE Ahorro1
            SET Monto_Actual = Monto_Actual + %s
            WHERE ID_Ahorro = %s AND ID_Usuario = %s
        """
        cursor.execute(query_actualizar_ahorro, (abono, id_ahorro, user_id))

        connection.commit()
        return jsonify({"message": "Abono registrado exitosamente"}), 201

    except Exception as e:
        connection.rollback()
        print(f"Error al registrar el abono: {e}")
        return jsonify({"error": "Error al registrar el abono"}), 500

    finally:
        connection.close()




from datetime import datetime, timedelta
from flask import jsonify
from math import pow

@app.route('/api/ahorros/actualizar', methods=['POST'])
def actualizar_ahorros():
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Obtener todos los ahorros con tasa de interés > 0
        query = """
        SELECT * FROM Ahorro1 WHERE Tasa_Interes > 0
        """
        cursor.execute(query)
        ahorros = cursor.fetchall()

        for ahorro in ahorros:
            monto_actual = float(ahorro['Monto_Actual'])
            tasa_interes = float(ahorro['Tasa_Interes']) / 100
            fecha_inicio = ahorro['Fecha_Inicio']
            ultima_fecha = ahorro['Ultima_Fecha_Utilizacion'] or fecha_inicio
            rendimiento_actual = float(ahorro['Rendimiento'] or 0)  # Rendimiento actual de la tabla
            fecha_actual = datetime.now().date()

            # Calcular días transcurridos
            dias_transcurridos = (fecha_actual - ultima_fecha).days
            print(f"Ahorro ID: {ahorro['ID_Ahorro']} - Días transcurridos: {dias_transcurridos}")

            if dias_transcurridos > 0:
                rendimiento_total = 0

                for d in range(1, dias_transcurridos + 1):
                    rendimiento_dia = monto_actual * (tasa_interes / 365)
                    monto_actual += rendimiento_dia
                    rendimiento_total += rendimiento_dia
                    print(f"Día {d}: Rendimiento del día: {rendimiento_dia:.2f}, Saldo actual: {monto_actual:.2f}")

                # Sumar el rendimiento acumulado al valor existente en la tabla
                nuevo_rendimiento = rendimiento_actual + rendimiento_total

                # Actualizar valores en la base de datos
                query_update = """
                UPDATE Ahorro1
                SET Monto_Actual = %s,
                    Ultima_Fecha_Utilizacion = %s,
                    Rendimiento = %s
                WHERE ID_Ahorro = %s
                """
                cursor.execute(query_update, (
                    round(monto_actual, 2),
                    fecha_actual,
                    round(nuevo_rendimiento, 2),
                    ahorro['ID_Ahorro']
                ))
                print(f"Ahorro ID: {ahorro['ID_Ahorro']} actualizado con éxito. Nuevo rendimiento total: {nuevo_rendimiento:.2f}")

        connection.commit()
        return jsonify({"message": "Ahorros actualizados correctamente."}), 200

    except Exception as e:
        print(f"Error al actualizar los ahorros: {e}")
        return jsonify({"error": "Error al actualizar los ahorros"}), 500

    finally:
        connection.close()




@app.route('/api/deuda', methods=['POST'], endpoint='crear_deuda')
@jwt_refresh_if_active
def crear_deuda():
    user_id = get_jwt_identity()
    data = request.json
    descripcion = data.get('descripcion')
    monto_deuda = data.get('montoDeuda')
    monto_total = data.get('montoTotal')
    tasa_interes = data.get('tasaInteres')
    fecha_inicio = data.get('fechaInicio')
    cuota_mensual = data.get('cuotaMensual')
    plazo = data.get('plazo')  # Número de meses

    if not all([descripcion, monto_deuda, monto_total, tasa_interes, fecha_inicio, cuota_mensual, plazo]):
        return jsonify({"error": "Datos incompletos"}), 400

    try:
        # Convertir el plazo y la fecha de inicio
        plazo = int(plazo)
        fecha_inicio_dt = datetime.strptime(fecha_inicio, '%Y-%m-%d')

        # Calcular la fecha límite de la deuda
        fecha_limite = fecha_inicio_dt + relativedelta(months=plazo)

        # Calcular la tasa mensual
        tasa_anual = float(tasa_interes) / 100
        r = tasa_anual / 12

        connection = create_connection()
        if connection is None:
            return jsonify({"error": "Error al conectar a la base de datos"}), 500

        cursor = connection.cursor()

        # Insertar en la tabla Deuda
        query_deuda = """
            INSERT INTO Deuda (Descripcion, Monto_Deuda, Monto_Total, Tasa_Interes, Fecha_Inicio, Plazo, Fecha_Limite, ID_Usuario)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query_deuda, (descripcion, monto_deuda, monto_total, tasa_interes, fecha_inicio, plazo, fecha_limite.date(), user_id))
        deuda_id = cursor.lastrowid

        # Variables para cálculos
        saldo_restante = float(monto_deuda)

        # Insertar en la tabla Deuda_Cuota con cálculos adicionales
        for i in range(plazo):
            cuota_fecha_limite = fecha_inicio_dt + relativedelta(months=i + 1)  # Calcular la fecha límite de cada cuota

            # Cálculos de los nuevos campos
            interes_cuota = saldo_restante * r
            capital_abonado = float(cuota_mensual) - interes_cuota
            nuevo_saldo_restante = saldo_restante - capital_abonado

            # Insertar la cuota
            query_cuota = """
                INSERT INTO Deuda_Cuota (ID_Deuda, Cuota, Interes_Cuota, Capital_Abonado, Saldo_Restante, Fecha_Limite, Estado)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query_cuota, (
                deuda_id,
                cuota_mensual,
                round(interes_cuota, 2),
                round(capital_abonado, 2),
                round(nuevo_saldo_restante, 2),
                cuota_fecha_limite.date(),
                'Pendiente'
            ))

            # Actualizar el saldo restante para la próxima cuota
            saldo_restante = nuevo_saldo_restante

        connection.commit()
        connection.close()

        return jsonify({"message": "Meta de deuda creada exitosamente"}), 201

    except Exception as e:
        print(f"Error al crear la deuda: {e}")
        return jsonify({"error": "Error al crear la deuda"}), 500

    

@app.route('/api/deudas', methods=['GET'], endpoint='obtener_deudas')
@jwt_refresh_if_active
def obtener_deudas():
    user_id = get_jwt_identity()  # ID del usuario autenticado
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        # Obtener todas las deudas del usuario
        query = """
            SELECT ID_Deuda, Descripcion, Monto_Deuda, Monto_Total, Tasa_Interes, Plazo, Fecha_Inicio
            FROM Deuda
            WHERE ID_Usuario = %s
        """
        cursor.execute(query, (user_id,))
        deudas = cursor.fetchall()

        # Determinar el estado de cada deuda
        for deuda in deudas:
            query_cuotas = """
                SELECT Estado
                FROM Deuda_Cuota
                WHERE ID_Deuda = %s
            """
            cursor.execute(query_cuotas, (deuda["ID_Deuda"],))
            cuotas = cursor.fetchall()

            # Verificar si hay cuotas pendientes
            if any(cuota["Estado"] == "Pendiente" for cuota in cuotas):
                deuda["Estatus"] = "En curso"
            else:
                deuda["Estatus"] = "Completada"

        connection.close()

        return jsonify(deudas), 200
    except Exception as e:
        print("Error al obtener las deudas:", e)
        return jsonify({"error": "Error al obtener las deudas"}), 500

    



@app.route('/api/deudas/<int:id_deuda>/abonar', methods=['POST'], endpoint='abonar_deuda')
@jwt_refresh_if_active
def abonar_deuda(id_deuda):
    user_id = get_jwt_identity()
    data = request.json
    monto_abonado = data.get('monto_abonado')
    nueva_cuota = data.get('nueva_cuota')
    saldo_anterior = data.get('saldo_anterior')
    nuevo_saldo = data.get('nuevo_saldo')
    tasa_interes = data.get('tasa_interes')  # Recibimos la tasa de interés

    try:
        tasa_interes = float(tasa_interes)  # Convertir la tasa de interés a float
    except (ValueError, TypeError):
        return jsonify({"error": "La tasa de interés no es válida"}), 400

    # Validar campos manualmente para permitir que `nueva_cuota` sea 0
    if monto_abonado is None or nueva_cuota is None or saldo_anterior is None or nuevo_saldo is None or tasa_interes is None:
        return jsonify({"error": "Datos incompletos"}), 400

    try:
        connection = create_connection()
        if connection is None:
            return jsonify({"error": "Error al conectar a la base de datos"}), 500

        # Configurar el cursor como DictCursor
        cursor = connection.cursor(dictionary=True)

        # Obtener la descripción de la deuda
        query_deuda = "SELECT Descripcion FROM Deuda WHERE ID_Deuda = %s"
        cursor.execute(query_deuda, (id_deuda,))
        deuda = cursor.fetchone()

        if not deuda:
            return jsonify({"error": "Deuda no encontrada"}), 404

        descripcion_deuda = deuda['Descripcion']

        # Crear registro en la tabla Abono_Deuda
        query_abono = """
            INSERT INTO Abono_Deuda (ID_Deuda, ID_Usuario, Monto_Anterior_Total, Monto_Abonado, Nuevo_Monto_Total, Fecha_Abono)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        fecha_abono = datetime.now()
        cursor.execute(query_abono, (
            id_deuda,
            user_id,
            round(saldo_anterior, 2),
            round(monto_abonado, 2),
            round(nuevo_saldo, 2),
            fecha_abono
        ))

        # Actualizar cuotas pendientes
        query_cuotas_pendientes = """
            SELECT ID_Deuda_Cuota, Saldo_Restante
            FROM Deuda_Cuota
            WHERE ID_Deuda = %s AND Estado = 'Pendiente'
            ORDER BY Fecha_Limite ASC
        """
        cursor.execute(query_cuotas_pendientes, (id_deuda,))
        cuotas_pendientes = cursor.fetchall()

        if not cuotas_pendientes:
            return jsonify({"error": "No hay cuotas pendientes para esta deuda"}), 400

        saldo_restante = nuevo_saldo
        tasa_mensual = tasa_interes / 100 / 12  # Usamos la tasa enviada desde el frontend

        for cuota in cuotas_pendientes:
            id_cuota = cuota['ID_Deuda_Cuota']

            # Si la nueva cuota es 0, marcar la cuota como pagada
            if nueva_cuota == 0:
                query_marcar_pagado = """
                    UPDATE Deuda_Cuota
                    SET Estado = 'Pagado', Saldo_Restante = 0, Capital_Abonado = Cuota, Interes_Cuota = 0
                    WHERE ID_Deuda_Cuota = %s
                """
                cursor.execute(query_marcar_pagado, (id_cuota,))
            else:
                # Calcular la cuota normalmente
                interes_cuota = saldo_restante * tasa_mensual
                capital_abonado = nueva_cuota - interes_cuota
                saldo_restante -= capital_abonado

                query_update_cuota = """
                    UPDATE Deuda_Cuota
                    SET Cuota = %s, Interes_Cuota = %s, Capital_Abonado = %s, Saldo_Restante = %s
                    WHERE ID_Deuda_Cuota = %s
                """
                cursor.execute(query_update_cuota, (
                    round(nueva_cuota, 2),
                    round(interes_cuota, 2),
                    round(capital_abonado, 2),
                    round(saldo_restante, 2),
                    id_cuota
                ))

        # Insertar el registro en la tabla Gasto
        query_insert_gasto = """
            INSERT INTO Gasto (Descripcion, Monto, Fecha, Categoria, Periodico, Periodicidad, ID_Usuario, ID_Subcategoria, EsFijo, ID_Grupo)
            VALUES (%s, %s, NOW(), %s, %s, NULL, %s, NULL, NULL, NULL)
        """
        descripcion_gasto = f"Abono ({descripcion_deuda})"
        categoria = "Deuda"
        periodico = 0  # Fijo en 0 para esta operación

        cursor.execute(query_insert_gasto, (
            descripcion_gasto,
            round(monto_abonado, 2),
            categoria,
            periodico,
            user_id
        ))

        connection.commit()
        connection.close()

        return jsonify({"message": "Abono realizado, cuotas actualizadas y gasto registrado correctamente"}), 200

    except Exception as e:
        print(f"Error al procesar el abono: {e}")
        return jsonify({"error": "Error al procesar el abono"}), 500




    

@app.route('/api/deudas/<int:id_deuda>', methods=['DELETE'], endpoint='eliminar_deuda')
@jwt_refresh_if_active
def eliminar_deuda(id_deuda):
    user_id = get_jwt_identity()  # ID del usuario autenticado
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()
        query = """
            DELETE FROM Deuda
            WHERE ID_Deuda = %s AND ID_Usuario = %s
        """
        cursor.execute(query, (id_deuda, user_id))
        connection.commit()
        connection.close()

        return jsonify({"message": "Deuda eliminada exitosamente"}), 200
    except Exception as e:
        print("Error al eliminar la deuda:", e)
        return jsonify({"error": "Error al eliminar la deuda"}), 500



@app.route('/api/deudas/<int:id_deuda>', methods=['GET'], endpoint='obtener_detalle_deuda')
@jwt_refresh_if_active
def obtener_detalle_deuda(id_deuda):
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Obtener la información de la deuda
        query_deuda = """
            SELECT ID_Deuda, Descripcion, Monto_Deuda, Monto_Total, Tasa_Interes, Plazo, Fecha_Inicio
            FROM Deuda
            WHERE ID_Deuda = %s AND ID_Usuario = %s
        """
        cursor.execute(query_deuda, (id_deuda, user_id))
        deuda = cursor.fetchone()

        if not deuda:
            return jsonify({"error": "Deuda no encontrada"}), 404

        # Obtener las cuotas relacionadas
        query_cuotas = """
            SELECT 
                ID_Deuda_Cuota, 
                Cuota, 
                Interes_Cuota, 
                Capital_Abonado, 
                Saldo_Restante, 
                Fecha_Limite, 
                Estado,
                CASE 
                    WHEN Fecha_Limite < CURDATE() AND Estado = 'Pendiente' 
                    THEN DATEDIFF(CURDATE(), Fecha_Limite)
                    ELSE 0
                END AS Dias_Atraso
            FROM Deuda_Cuota
            WHERE ID_Deuda = %s
            ORDER BY Fecha_Limite ASC
        """

        cursor.execute(query_cuotas, (id_deuda,))
        cuotas = cursor.fetchall()

        # Calcular cuántas cuotas están pendientes
        cuotas_pendientes = sum(1 for cuota in cuotas if cuota['Estado'] == 'Pendiente')

        # Agregar la información de las cuotas pendientes a la respuesta
        deuda['Cuotas'] = cuotas
        deuda['Cuotas_Pendientes'] = cuotas_pendientes

        # Mostrar cuántas cuotas faltan en la terminal
        print(f"Deuda ID {id_deuda} - Cuotas pendientes: {cuotas_pendientes}")

        return jsonify(deuda), 200

    except Exception as e:
        print(f"Error al obtener el detalle de la deuda: {e}")
        return jsonify({"error": "Error al obtener el detalle de la deuda"}), 500

    finally:
        connection.close()





@app.route('/api/deudas/cuotas/<int:id_cuota>/pagar', methods=['PUT'], endpoint='pagar_cuota')
@jwt_required()
def pagar_cuota(id_cuota):
    user_id = get_jwt_identity()  # Verificar que el usuario esté autenticado
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()

        # Verificar si la cuota pertenece al usuario
        query_check = """
            SELECT dc.ID_Deuda_Cuota, dc.Cuota, d.Descripcion
            FROM Deuda_Cuota dc
            JOIN Deuda d ON dc.ID_Deuda = d.ID_Deuda
            WHERE dc.ID_Deuda_Cuota = %s AND d.ID_Usuario = %s
        """
        cursor.execute(query_check, (id_cuota, user_id))
        cuota = cursor.fetchone()

        if not cuota:
            return jsonify({"error": "Cuota no encontrada o no pertenece al usuario"}), 404

        cuota_id, monto_cuota, descripcion_deuda = cuota

        # Actualizar el estado de la cuota a "Pagado"
        query_update = """
            UPDATE Deuda_Cuota
            SET Estado = 'Pagado'
            WHERE ID_Deuda_Cuota = %s
        """
        cursor.execute(query_update, (cuota_id,))
        connection.commit()

        # Registrar el gasto correspondiente en la tabla Gasto
        descripcion_gasto = f"Pago deuda ({descripcion_deuda})"
        query_gasto = """
            INSERT INTO Gasto (Descripcion, Monto, Fecha, Categoria, Periodico, ID_Usuario)
            VALUES (%s, %s, CURDATE(), 'Deuda', 0, %s)
        """
        cursor.execute(query_gasto, (descripcion_gasto, monto_cuota, user_id))
        connection.commit()

        return jsonify({"message": "Cuota marcada como pagada exitosamente y gasto registrado"}), 200

    except Exception as e:
        print(f"Error al pagar la cuota: {e}")
        return jsonify({"error": "Error al pagar la cuota"}), 500

    finally:
        connection.close()



@app.route('/api/deudas/cuotas/<int:id_cuota>/pagar-atrasada', methods=['PUT'], endpoint='pagar_cuota_atrasada')
@jwt_refresh_if_active
def pagar_cuota_atrasada(id_cuota):
    data = request.json
    nuevo_monto = data.get('nuevoMonto')

    if not nuevo_monto or float(nuevo_monto) <= 0:
        return jsonify({"error": "El monto ingresado no es válido"}), 400

    try:
        connection = create_connection()
        if connection is None:
            return jsonify({"error": "Error al conectar a la base de datos"}), 500

        cursor = connection.cursor(dictionary=True)

        # Obtener la cuota original
        query_select_cuota = """
            SELECT Cuota, Interes_Cuota, ID_Deuda
            FROM Deuda_Cuota
            WHERE ID_Deuda_Cuota = %s
        """
        cursor.execute(query_select_cuota, (id_cuota,))
        cuota = cursor.fetchone()

        if not cuota:
            return jsonify({"error": "Cuota no encontrada"}), 404

        monto_original = float(cuota['Cuota'])
        interes_original = float(cuota['Interes_Cuota'])
        id_deuda = cuota['ID_Deuda']

        # Obtener la descripción de la deuda
        query_deuda = "SELECT Descripcion FROM Deuda WHERE ID_Deuda = %s"
        cursor.execute(query_deuda, (id_deuda,))
        deuda = cursor.fetchone()

        if not deuda:
            return jsonify({"error": "Deuda no encontrada"}), 404

        descripcion_deuda = deuda['Descripcion']

        # Calcular la diferencia y actualizar los valores
        diferencia = float(nuevo_monto) - monto_original
        nuevo_interes = interes_original + diferencia

        # Actualizar la cuota en la base de datos
        query_update_cuota = """
            UPDATE Deuda_Cuota
            SET Cuota = %s, Interes_Cuota = %s, Estado = 'Pagado'
            WHERE ID_Deuda_Cuota = %s
        """
        cursor.execute(query_update_cuota, (
            round(nuevo_monto, 2),
            round(nuevo_interes, 2),
            id_cuota
        ))

        # Insertar el registro en la tabla Gasto
        query_insert_gasto = """
            INSERT INTO Gasto (Descripcion, Monto, Fecha, Categoria, Periodico, Periodicidad, ID_Usuario, ID_Subcategoria, EsFijo, ID_Grupo)
            VALUES (%s, %s, NOW(), %s, %s, NULL, %s, NULL, NULL, NULL)
        """
        descripcion_gasto = f"Pago atrasado ({descripcion_deuda})"
        categoria = "Deuda"
        periodico = 0  # Fijo en 0 para esta operación
        id_usuario = get_jwt_identity()  # Obtener el ID del usuario actual

        cursor.execute(query_insert_gasto, (
            descripcion_gasto,
            round(nuevo_monto, 2),
            categoria,
            periodico,
            id_usuario
        ))

        connection.commit()
        connection.close()

        return jsonify({"message": "Cuota atrasada pagada correctamente y gasto registrado"}), 200

    except Exception as e:
        print(f"Error al procesar el pago de la cuota atrasada: {e}")
        return jsonify({"error": "Error al procesar el pago de la cuota atrasada"}), 500




@app.route('/api/validar-ingresos-gastos', methods=['GET'], endpoint='Promedio_gastos_ingresos')
@jwt_refresh_if_active
def validar_ingresos_gastos():
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor(dictionary=True)
    
    # Contar ingresos del usuario
    query_ingresos = "SELECT COUNT(*) as total FROM Ingreso WHERE ID_Usuario = %s"
    cursor.execute(query_ingresos, (user_id,))
    total_ingresos = cursor.fetchone()['total']
    
    # Contar gastos del usuario
    query_gastos = "SELECT COUNT(*) as total FROM Gasto WHERE ID_Usuario = %s"
    cursor.execute(query_gastos, (user_id,))
    total_gastos = cursor.fetchone()['total']
    
    connection.close()
    
    if total_ingresos >= 3 and total_gastos >= 3:
        return jsonify({"valido": True}), 200
    else:
        return jsonify({"valido": False}), 200

@app.route('/api/promedios', methods=['GET'], endpoint='Promedios_total')
@jwt_refresh_if_active
def obtener_promedios():
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor(dictionary=True)
    
    # Calcular promedio de ingresos del usuario
    query_promedio_ingresos = "SELECT AVG(Monto) as promedio_ingresos FROM Ingreso WHERE ID_Usuario = %s"
    cursor.execute(query_promedio_ingresos, (user_id,))
    promedio_ingresos = cursor.fetchone()['promedio_ingresos']
    
    # Calcular promedio de gastos del usuario
    query_promedio_gastos = "SELECT AVG(Monto) as promedio_gastos FROM Gasto WHERE ID_Usuario = %s"
    cursor.execute(query_promedio_gastos, (user_id,))
    promedio_gastos = cursor.fetchone()['promedio_gastos']
    
    connection.close()
    
    # Calcular el valor disponible para metas
    disponible_para_metas = promedio_ingresos - promedio_gastos
    
    return jsonify({
        "promedio_ingresos": promedio_ingresos,
        "promedio_gastos": promedio_gastos,
        "disponible_para_metas": disponible_para_metas
    }), 200

# Eliminar meta financiera
@app.route('/api/metas/<int:id_meta>', methods=['DELETE'], endpoint='eliminar_metas')
@jwt_refresh_if_active
def eliminar_meta(id_meta):
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()
        
        # Primero eliminar transacciones asociadas
        query_transacciones = "DELETE FROM TransaccionesMeta WHERE ID_Meta = %s"
        cursor.execute(query_transacciones, (id_meta,))
        
        # Luego eliminar la meta
        query_meta = "DELETE FROM Metas WHERE ID_Meta = %s AND ID_Usuario = %s"
        cursor.execute(query_meta, (id_meta, user_id))
        
        connection.commit()
    except mysql.connector.Error as err:
        connection.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        connection.close()

    return '', 204




@app.route('/api/ingresos/mensuales', methods=['GET'], endpoint='Ingreso_mensual')
@jwt_refresh_if_active
def obtener_ingresos_mensuales():
    user_id = get_jwt_identity()
    mes = request.args.get('mes')
    año = request.args.get('año')

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT ID_Ingreso as ID, Descripcion, Monto, Fecha
    FROM Ingreso
    WHERE ID_Usuario = %s AND MONTH(Fecha) = %s AND YEAR(Fecha) = %s
    """
    cursor.execute(query, (user_id, mes, año))
    ingresos = cursor.fetchall()

    connection.close()
    return jsonify(ingresos), 200


@app.route('/api/gastos/mensuales', methods=['GET'], endpoint='Gastos_mensuales')
@jwt_refresh_if_active
def obtener_gastos_mensuales():
    user_id = get_jwt_identity()
    mes = request.args.get('mes')
    año = request.args.get('año')

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT ID_Gasto as ID, Descripcion, Monto, Fecha
    FROM Gasto
    WHERE ID_Usuario = %s AND MONTH(Fecha) = %s AND YEAR(Fecha) = %s
    """
    cursor.execute(query, (user_id, mes, año))
    gastos = cursor.fetchall()

    connection.close()
    return jsonify(gastos), 200

@app.route('/api/totales_financieros', methods=['GET'], endpoint='totales_financieros')
@jwt_refresh_if_active
def obtener_totales_financieros():
    user_id = get_jwt_identity()
    filters = request.args
    mes = filters.get('mes')
    año = filters.get('año')

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Consulta para obtener los totales de ingresos y gastos por mes
    query_ingresos = """
    SELECT 
        MONTH(Fecha) as mes, 
        YEAR(Fecha) as año, 
        SUM(Monto) as total_ingresos
    FROM Ingreso
    WHERE ID_Usuario = %s
    GROUP BY YEAR(Fecha), MONTH(Fecha)
    ORDER BY YEAR(Fecha), MONTH(Fecha)
    """

    query_gastos = """
    SELECT 
        MONTH(Fecha) as mes, 
        YEAR(Fecha) as año, 
        SUM(Monto) as total_gastos
    FROM Gasto
    WHERE ID_Usuario = %s
    GROUP BY YEAR(Fecha), MONTH(Fecha)
    ORDER BY YEAR(Fecha), MONTH(Fecha)
    """

    # Ejecutar las consultas y obtener los resultados
    cursor.execute(query_ingresos, (user_id,))
    ingresos_por_mes = cursor.fetchall()

    cursor.execute(query_gastos, (user_id,))
    gastos_por_mes = cursor.fetchall()

    # Combinar los datos de ingresos y gastos en una sola lista
    monthly_totals = []
    ingresos_dict = {(ingreso['año'], ingreso['mes']): ingreso['total_ingresos'] for ingreso in ingresos_por_mes}
    gastos_dict = {(gasto['año'], gasto['mes']): gasto['total_gastos'] for gasto in gastos_por_mes}

    for (año, mes) in set(ingresos_dict.keys()).union(gastos_dict.keys()):
        monthly_totals.append({
            'año': año,
            'mes': mes,
            'total_ingresos': ingresos_dict.get((año, mes), 0),
            'total_gastos': gastos_dict.get((año, mes), 0)
        })

    # Ordenar los resultados por año y mes
    monthly_totals = sorted(monthly_totals, key=lambda x: (x['año'], x['mes']))

    connection.close()
    return jsonify(monthly_totals), 200



@app.route('/api/totales_financieros_mes', methods=['GET'], endpoint='Financieros_mes')
@jwt_refresh_if_active
def obtener_totales_financieros_mes():
    user_id = get_jwt_identity()
    mes = request.args.get('mes')
    año = request.args.get('año')

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Consulta para obtener el total de ingresos para el mes y año seleccionados
    query_ingresos = """
    SELECT SUM(Monto) as total_ingresos
    FROM Ingreso
    WHERE ID_Usuario = %s AND MONTH(Fecha) = %s AND YEAR(Fecha) = %s
    """
    cursor.execute(query_ingresos, (user_id, mes, año))
    total_ingresos = cursor.fetchone()['total_ingresos'] or 0

    # Consulta para obtener el total de gastos para el mes y año seleccionados
    query_gastos = """
    SELECT SUM(Monto) as total_gastos
    FROM Gasto
    WHERE ID_Usuario = %s AND MONTH(Fecha) = %s AND YEAR(Fecha) = %s
    """
    cursor.execute(query_gastos, (user_id, mes, año))
    total_gastos = cursor.fetchone()['total_gastos'] or 0

    connection.close()

    return jsonify({"total_ingresos": total_ingresos, "total_gastos": total_gastos}), 200


def generate_unique_code(cursor):
    while True:
        # Generar un código alfanumérico de 8 caracteres en mayúsculas
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        # Verificar si el código ya existe en la tabla 'Grupo'
        cursor.execute("SELECT COUNT(*) as count FROM Grupo WHERE Codigo_Invitacion = %s", (code,))
        result = cursor.fetchone()
        if result["count"] == 0:  # Verificamos el conteo usando la clave del diccionario
            return code


@app.route('/api/crear_grupo', methods=['POST'], endpoint='Crear_grupo')
@jwt_refresh_if_active
def crear_grupo():
    data = request.json
    nombre_grupo = data.get('nombre_grupo')
    descripcion = data.get('descripcion')
    miembros = data.get('miembros', [])
    user_id = get_jwt_identity()  # Obtener el ID del usuario que está creando el grupo

    connection = create_connection()
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Obtener el correo del usuario que está creando el grupo
        cursor.execute("SELECT Email FROM Usuario WHERE ID_Usuario = %s", (user_id,))
        user_data = cursor.fetchone()
        if not user_data:
            return jsonify({"error": "Usuario no encontrado"}), 404
        user_email = user_data["Email"]

        # Generar un código de invitación único
        codigo_invitacion = generate_unique_code(cursor)

        # Insertar el grupo en la tabla `Grupo`
        cursor.execute("""
            INSERT INTO Grupo (Nombre_Grupo, Descripcion, ID_Admin, Codigo_Invitacion)
            VALUES (%s, %s, %s, %s)
        """, (nombre_grupo, descripcion, user_id, codigo_invitacion))
        connection.commit()

        # Obtener el ID del grupo recién creado
        grupo_id = cursor.lastrowid

        # Insertar al usuario creador como miembro del grupo con su correo
        cursor.execute("""
            INSERT INTO Miembro_Grupo (ID_Usuario, ID_Grupo, Email, Confirmado)
            VALUES (%s, %s, %s, %s)
        """, (user_id, grupo_id, user_email, 1))  # Confirmado = 1 para el creador del grupo
        
        # Procesar los miembros adicionales y enviarles una invitación por correo
        for email in miembros:
            cursor.execute("SELECT ID_Usuario FROM Usuario WHERE Email = %s", (email,))
            usuario = cursor.fetchone()
            id_usuario = usuario['ID_Usuario'] if usuario else None

            # Insertar el miembro en la tabla Miembro_Grupo con Confirmado = 0
            cursor.execute("""
                INSERT INTO Miembro_Grupo (ID_Usuario, ID_Grupo, Email, Confirmado)
                VALUES (%s, %s, %s, %s)
            """, (id_usuario, grupo_id, email, 0))

            # Enviar correo de invitación
            send_invitation_email(email, grupo_id, nombre_grupo)

        connection.commit()

        # Devolver el enlace de invitación
        invitation_link = f"https://tuapp.com/invite/{codigo_invitacion}"
        return jsonify({"message": "Grupo creado exitosamente", "invitationLink": invitation_link}), 201
    
    except mysql.connector.Error as e:
        connection.rollback()
        return jsonify({"error": f"Error al crear el grupo: {str(e)}"}), 500
    
    finally:
        cursor.close()
        connection.close()

# Registrar una nueva transacción para una meta
@app.route('/api/metas/<int:id_meta>/transacciones', methods=['POST'], endpoint='registrar_transaccion_meta')
@jwt_refresh_if_active
def registrar_transaccion(id_meta):
    user_id = get_jwt_identity()
    data = request.json
    monto_ahorrado = data.get('montoAhorrado')
    fecha_transaccion = data.get('fechaTransaccion')
    
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor()
    query = """
        INSERT INTO TransaccionesMeta (ID_Meta, MontoAhorrado, FechaTransaccion)
        VALUES (%s, %s, %s)
    """
    cursor.execute(query, (id_meta, monto_ahorrado, fecha_transaccion))
    connection.commit()
    
    connection.close()
    return jsonify({"message": "Transacción registrada exitosamente"}), 201



@app.route('/api/metas/<int:id_meta>', methods=['GET'], endpoint='obtener_metas2')
@jwt_refresh_if_active
def obtener_meta(id_meta):
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor(dictionary=True)
    query_meta = """
        SELECT ID_Meta, Nombre, MontoObjetivo, FechaInicio, FechaTermino, MesesParaMeta, AhorroMensual
        FROM Metas
        WHERE ID_Meta = %s AND ID_Usuario = %s
    """
    cursor.execute(query_meta, (id_meta, user_id))
    meta = cursor.fetchone()

    if meta:
        query_ahorrado = """
            SELECT COALESCE(SUM(MontoAhorrado), 0) as MontoAhorrado
            FROM TransaccionesMeta
            WHERE ID_Meta = %s
        """
        cursor.execute(query_ahorrado, (id_meta,))
        resultado_ahorrado = cursor.fetchone()
        meta['MontoAhorrado'] = resultado_ahorrado['MontoAhorrado'] if resultado_ahorrado['MontoAhorrado'] is not None else 0

        query_transacciones = """
            SELECT ID_Transaccion, MontoAhorrado, FechaTransaccion
            FROM TransaccionesMeta
            WHERE ID_Meta = %s
        """
        cursor.execute(query_transacciones, (id_meta,))
        meta['transacciones'] = cursor.fetchall()

    connection.close()
    return jsonify(meta), 200


@app.route('/api/metas/<int:id_meta>/transacciones', methods=['GET'], endpoint='obtener_transacciones_meta')
@jwt_refresh_if_active
def obtener_transacciones(id_meta):
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor(dictionary=True)
    query = """
        SELECT ID_Transaccion, MontoAhorrado, FechaTransaccion
        FROM TransaccionesMeta
        WHERE ID_Meta = %s
    """
    cursor.execute(query, (id_meta,))
    transacciones = cursor.fetchall()

    connection.close()
    return jsonify(transacciones), 200





def send_invitation_email(email, grupo_id, nombre_grupo):
    # URL para que el usuario acepte la invitación
    accept_url = f"http://localhost:5000/api/accept_invitation?grupo_id={grupo_id}&email={email}"
    msg = Message(
        subject="Invitación a unirse al grupo financiero",
        sender="tu_correo@example.com",
        recipients=[email],
        body=f"Has sido invitado a unirte al grupo '{nombre_grupo}'. Haz clic en el siguiente enlace para aceptar la invitación:\n{accept_url}"
    )
    mail.send(msg)       
        
    
@app.route('/api/accept_invitation', methods=['GET'])
def accept_invitation():
    grupo_id = request.args.get('grupo_id')
    email = request.args.get('email')

    connection = create_connection()
    cursor = connection.cursor()

    try:
        # Actualizar el campo Confirmado a 1 para el miembro
        cursor.execute("""
            UPDATE Miembro_Grupo
            SET Confirmado = 1
            WHERE ID_Grupo = %s AND Email = %s
        """, (grupo_id, email))
        connection.commit()

        return jsonify({"message": "Invitación aceptada exitosamente"}), 200
    
    except mysql.connector.Error as e:
        connection.rollback()
        return jsonify({"error": f"Error al aceptar la invitación: {str(e)}"}), 500
    
    finally:
        cursor.close()
        connection.close()




@app.route('/api/grupos', methods=['GET'], endpoint='obtener_grupos')
@jwt_refresh_if_active
def obtener_grupos_usuario():
    user_id = get_jwt_identity()

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)
    try:
        # Obtener los grupos en los que el usuario pertenece y está confirmado
        query_grupos = """
        SELECT g.ID_Grupo, g.Nombre_Grupo, g.Descripcion, 
               CONCAT(u.Nombre, ' ', u.Apellido_P, ' ', u.Apellido_M) AS Nombre_Admin,
               CASE WHEN g.ID_Admin = %s THEN 1 ELSE 0 END AS es_admin
        FROM Grupo g
        JOIN Usuario u ON g.ID_Admin = u.ID_Usuario
        JOIN Miembro_Grupo mg ON g.ID_Grupo = mg.ID_Grupo
        WHERE mg.ID_Usuario = %s AND mg.Confirmado = 1
        """
        cursor.execute(query_grupos, (user_id, user_id))
        grupos = cursor.fetchall()
    except Exception as e:
        return jsonify({"error": f"Error al obtener los grupos: {str(e)}"}), 500
    finally:
        cursor.close()
        connection.close()

    return jsonify(grupos), 200

@app.route('/api/grupo/<int:grupo_id>', methods=['GET'], endpoint='obtener_grpo1')
@jwt_refresh_if_active
def obtener_info_grupo(grupo_id):
    user_id = get_jwt_identity()

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar si el usuario pertenece al grupo
        query_verificar = """
        SELECT Confirmado 
        FROM Miembro_Grupo 
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Obtener información del grupo
        query_grupo = """
        SELECT g.ID_Grupo, g.Nombre_Grupo, g.Descripcion, 
               CONCAT(u.Nombre, ' ', u.Apellido_P, ' ', u.Apellido_M) AS Nombre_Admin,
               g.Codigo_Invitacion, g.ID_Admin
        FROM Grupo g
        JOIN Usuario u ON g.ID_Admin = u.ID_Usuario
        WHERE g.ID_Grupo = %s
        """
        cursor.execute(query_grupo, (grupo_id,))
        grupo_info = cursor.fetchone()

        if not grupo_info:
            return jsonify({"error": "Grupo no encontrado"}), 404

        # Obtener miembros del grupo
        query_miembros = """
        SELECT u.ID_Usuario, 
               CONCAT(u.Nombre, ' ', u.Apellido_P, ' ', u.Apellido_M) AS Nombre_Completo, 
               mg.Email, 
               u.Contacto,
               mg.Confirmado
        FROM Miembro_Grupo mg
        LEFT JOIN Usuario u ON mg.ID_Usuario = u.ID_Usuario
        WHERE mg.ID_Grupo = %s
        """
        cursor.execute(query_miembros, (grupo_id,))
        miembros = cursor.fetchall()
        grupo_info['Miembros'] = miembros

        # Obtener metas grupales asociadas
        query_metas = """
        SELECT ID_Ahorro_Grupal, Descripcion, Monto_Objetivo, Monto_Actual, Fecha_Inicio, Fecha_Limite
        FROM Meta_Ahorro_Grupal
        WHERE ID_Grupo = %s
        """
        cursor.execute(query_metas, (grupo_id,))
        metas = cursor.fetchall()

        grupo_info['Metas'] = metas

        return jsonify(grupo_info), 200

    except Exception as e:
        return jsonify({"error": f"Error al obtener información del grupo: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()


@app.route('/api/grupo/<int:grupo_id>/info', methods=['GET'], endpoint='info_grupo')
@jwt_refresh_if_active
def obtener_info_basica_grupo(grupo_id):
    """
    Endpoint para obtener información básica de un grupo (nombre y descripción) 
    y verificar si el usuario pertenece al grupo.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado

    connection = create_connection()  # Crear conexión a la base de datos
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar si el usuario pertenece al grupo y está confirmado
        query_verificar = """
        SELECT Confirmado 
        FROM Miembro_Grupo 
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Obtener información básica del grupo
        query_grupo = """
        SELECT Nombre_Grupo, Descripcion
        FROM Grupo
        WHERE ID_Grupo = %s
        """
        cursor.execute(query_grupo, (grupo_id,))
        grupo_info = cursor.fetchone()

        if not grupo_info:
            return jsonify({"error": "Grupo no encontrado"}), 404

        return jsonify(grupo_info), 200

    except Exception as e:
        return jsonify({"error": f"Error al obtener información del grupo: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()

@app.route('/api/grupo/<int:grupo_id>/gastos', methods=['GET'], endpoint='obtener_gastos_grupo')
@jwt_refresh_if_active
def obtener_gastos_grupo(grupo_id):
    """
    Endpoint para obtener los gastos de un grupo específico.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar si el usuario pertenece al grupo y está confirmado
        query_verificar = """
        SELECT Confirmado 
        FROM Miembro_Grupo 
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Obtener los gastos del grupo junto con el nombre del responsable
        query_gastos = """
        SELECT g.ID_Gasto_Grupal, g.Descripcion, g.Monto, g.Fecha, 
               COALESCE(u1.Nombre_Completo, u2.Nombre_Completo, 'Pendiente') AS Responsable,
               g.Estado
        FROM Gasto_Grupal g
        LEFT JOIN (
            SELECT ID_Usuario, CONCAT(Nombre, ' ', Apellido_P, ' ', Apellido_M) AS Nombre_Completo
            FROM Usuario
        ) u1 ON g.ID_Usuario = u1.ID_Usuario
        LEFT JOIN (
            SELECT ID_Usuario, CONCAT(Nombre, ' ', Apellido_P, ' ', Apellido_M) AS Nombre_Completo
            FROM Usuario
        ) u2 ON g.Asignado_A = u2.ID_Usuario
        WHERE g.ID_Grupo = %s
        ORDER BY g.Fecha DESC
        """
        cursor.execute(query_gastos, (grupo_id,))
        gastos = cursor.fetchall()

        # Validar y formatear las fechas para JSON
        for gasto in gastos:
            if gasto['Fecha']:
                gasto['Fecha'] = gasto['Fecha'].strftime('%Y-%m-%d')
            else:
                gasto['Fecha'] = None

        return jsonify(gastos), 200

    except Exception as e:
        return jsonify({"error": f"Error al obtener los gastos del grupo: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()

@app.route('/api/grupo/<int:grupo_id>/salir', methods=['DELETE'],  endpoint='Salir_grupo')
@jwt_refresh_if_active
def salir_grupo(grupo_id):
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado

    connection = create_connection()  # Conexión a la base de datos
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar si el usuario pertenece al grupo
        query_verificar = """
        SELECT g.Nombre_Grupo, g.ID_Admin, 
               CONCAT(u.Nombre, ' ', u.Apellido_P) AS Nombre_Completo,
               u.Email 
        FROM Miembro_Grupo mg
        JOIN Grupo g ON mg.ID_Grupo = g.ID_Grupo
        JOIN Usuario u ON mg.ID_Usuario = u.ID_Usuario
        WHERE mg.ID_Usuario = %s AND mg.ID_Grupo = %s
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro_info = cursor.fetchone()

        if not miembro_info:
            return jsonify({"error": "No perteneces a este grupo"}), 403

        # Verificar si el usuario es administrador (administradores no pueden darse de baja)
        if miembro_info['ID_Admin'] == user_id:
            return jsonify({"error": "No puedes salir del grupo porque eres el administrador"}), 403

        # Eliminar al usuario del grupo
        query_eliminar = """
        DELETE FROM Miembro_Grupo
        WHERE ID_Usuario = %s AND ID_Grupo = %s
        """
        cursor.execute(query_eliminar, (user_id, grupo_id))
        connection.commit()

        # Obtener el correo del administrador
        query_admin_email = """
        SELECT Email 
        FROM Usuario 
        WHERE ID_Usuario = %s
        """
        cursor.execute(query_admin_email, (miembro_info['ID_Admin'],))
        admin_email = cursor.fetchone()

        if admin_email:
            # Enviar correo al administrador
            msg = Message(
                subject="Notificación de baja del grupo",
                sender="tu_correo@example.com",
                recipients=[admin_email['Email']],
                body=(
                    f"Hola,\n\n"
                    f"El usuario {miembro_info['Nombre_Completo']} con correo {miembro_info['Email']} "
                    f"se ha dado de baja de tu grupo \"{miembro_info['Nombre_Grupo']}\".\n\n"
                    f"Saludos."
                )
            )
            mail.send(msg)

        return jsonify({"message": "Te has dado de baja del grupo exitosamente"}), 200

    except Exception as e:
        return jsonify({"error": f"Error al procesar la solicitud: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()


@app.route('/api/grupo/<int:grupo_id>/gastos/filtrados', methods=['POST'], endpoint='obtener_gastos_grupales_filtrados')
@jwt_refresh_if_active
def obtener_gastos_grupales_filtrados(grupo_id):
    """
    Endpoint para obtener los gastos grupales, con soporte para filtros opcionales de estado, responsable, rango de fechas y fecha específica.
    Si no se aplican filtros, devuelve todos los gastos del grupo.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado
    data = request.json
    estado = data.get('estado', None)  # 'Pagado' o 'Pendiente'
    responsable_id = data.get('responsable', None)  # ID del miembro responsable
    fecha = data.get('fecha', None)  # Fecha específica
    fecha_inicio = data.get('fecha_inicio', None)  # Fecha de inicio del rango
    fecha_fin = data.get('fecha_fin', None)  # Fecha de fin del rango

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar si el usuario pertenece al grupo y está confirmado
        query_verificar = """
        SELECT Confirmado,
               (SELECT ID_Admin FROM Grupo WHERE ID_Grupo = %s) AS ID_Admin
        FROM Miembro_Grupo
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (grupo_id, user_id, grupo_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Determinar si el usuario es administrador
        es_admin = miembro['ID_Admin'] == user_id

        # Construir la consulta SQL con filtros dinámicos
        query = """
        SELECT 
            G.ID_Gasto_Grupal AS ID_Gasto,
            G.Descripcion,
            G.Monto,
            G.Fecha,
            G.Estado,
            G.ID_Usuario AS ID_Usuario, -- ID del usuario que registró el gasto
            CASE 
                WHEN G.Asignado_A IS NOT NULL THEN CONCAT(U1.Nombre, ' ', U1.Apellido_P, ' ', U1.Apellido_M)
                WHEN G.ID_Usuario IS NOT NULL THEN CONCAT(U2.Nombre, ' ', U2.Apellido_P, ' ', U2.Apellido_M)
                ELSE 'Pendiente'
            END AS Responsable
        FROM Gasto_Grupal G
        LEFT JOIN Usuario U1 ON G.Asignado_A = U1.ID_Usuario
        LEFT JOIN Usuario U2 ON G.ID_Usuario = U2.ID_Usuario
        WHERE G.ID_Grupo = %s
        """
        params = [grupo_id]

        # Aplicar filtros dinámicamente
        if estado:
            query += " AND G.Estado = %s"
            params.append(estado)

        if responsable_id:
            query += " AND (G.Asignado_A = %s OR G.ID_Usuario = %s)"
            params.extend([responsable_id, responsable_id])

        if fecha:  # Si hay fecha específica, ignorar rango de fechas
            query += " AND DATE(G.Fecha) = %s"
            params.append(fecha)
        elif fecha_inicio and fecha_fin:
            query += " AND G.Fecha BETWEEN %s AND %s"
            params.append(fecha_inicio)
            params.append(fecha_fin)
        elif fecha_inicio:  # Si solo hay fecha de inicio
            query += " AND G.Fecha >= %s"
            params.append(fecha_inicio)
        elif fecha_fin:  # Si solo hay fecha de fin
            query += " AND G.Fecha <= %s"
            params.append(fecha_fin)

        # Ordenar los resultados por fecha descendente
        query += " ORDER BY G.Fecha DESC"

        cursor.execute(query, params)
        gastos = cursor.fetchall()

        # Respuesta del endpoint
        response = {
            "EsAdmin": es_admin,
            "UserId": user_id,
            "Gastos": gastos,
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": f"Error al obtener los gastos filtrados del grupo: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()


@app.route('/api/grupo/<int:grupo_id>/gastos/<int:gasto_id>', methods=['DELETE'], endpoint='eliminar_gasto_grupal')
@jwt_required()
def eliminar_gasto_grupal(grupo_id, gasto_id):
    """
    Endpoint para eliminar un gasto grupal.
    Solo el administrador del grupo o el usuario que registró el gasto pueden eliminarlo.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar si el usuario pertenece al grupo y está confirmado
        query_verificar = """
        SELECT Confirmado, ID_Admin 
        FROM Grupo 
        INNER JOIN Miembro_Grupo ON Grupo.ID_Grupo = Miembro_Grupo.ID_Grupo
        WHERE Miembro_Grupo.ID_Usuario = %s AND Grupo.ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Obtener información del gasto
        query_gasto = """
        SELECT ID_Usuario, ID_Grupo
        FROM Gasto_Grupal
        WHERE ID_Gasto_Grupal = %s AND ID_Grupo = %s
        """
        cursor.execute(query_gasto, (gasto_id, grupo_id))
        gasto = cursor.fetchone()

        if not gasto:
            return jsonify({"error": "El gasto no existe o no pertenece a este grupo"}), 404

        # Verificar si el usuario es administrador o el creador del gasto
        if miembro['ID_Admin'] != user_id and gasto['ID_Usuario'] != user_id:
            return jsonify({"error": "No tienes permiso para eliminar este gasto"}), 403

        # Eliminar el gasto
        query_eliminar = "DELETE FROM Gasto_Grupal WHERE ID_Gasto_Grupal = %s"
        cursor.execute(query_eliminar, (gasto_id,))
        connection.commit()

        return jsonify({"message": "Gasto eliminado exitosamente"}), 200

    except Exception as e:
        return jsonify({"error": f"Error al eliminar el gasto: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()



@app.route('/api/grupo/<int:grupo_id>/registrar-gasto', methods=['POST'], endpoint='gasto_grupal')
@jwt_refresh_if_active
def registrar_gasto_grupal(grupo_id):
    user_id = get_jwt_identity()
    data = request.json

    descripcion = data.get('descripcion')
    monto = data.get('monto')
    fecha = data.get('fecha')
    asignado_a = data.get('asignado_a', None)
    es_mi_gasto = data.get('es_mi_gasto', False)

    if not descripcion or not monto or not fecha:
        return jsonify({"error": "Faltan datos requeridos (descripción, monto o fecha)."}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar si el usuario es miembro del grupo y está confirmado
        query_verificar = """
        SELECT ID_Usuario, ID_Grupo, Confirmado, 
               CASE WHEN ID_Usuario = (SELECT ID_Admin FROM Grupo WHERE ID_Grupo = %s) THEN 1 ELSE 0 END AS es_admin
        FROM Miembro_Grupo
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (grupo_id, user_id, grupo_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo o no estás confirmado."}), 403

        es_admin = miembro['es_admin']

        # Caso especial: Gasto para "cualquiera" (asignado_a es None y es_mi_gasto es False)
        if es_admin and not es_mi_gasto and not asignado_a:
            estado = "Pendiente"
            query_insert_grupal = """
            INSERT INTO Gasto_Grupal (Descripcion, Monto, Fecha, ID_Grupo, Asignado_A, Estado)
            VALUES (%s, %s, %s, %s, NULL, %s)
            """
            cursor.execute(query_insert_grupal, (descripcion, monto, fecha, grupo_id, estado))

        # Caso: Gasto asignado a un usuario o propio del admin
        elif es_admin and (es_mi_gasto or asignado_a):
            estado = "Pendiente" if asignado_a else "Pagado"
            id_usuario_destino = asignado_a if asignado_a else user_id
            query_insert_grupal = """
            INSERT INTO Gasto_Grupal (Descripcion, Monto, Fecha, ID_Grupo, Asignado_A, Estado)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query_insert_grupal, (descripcion, monto, fecha, grupo_id, id_usuario_destino, estado))

            # Registrar en Gasto personal
            query_insert_personal = """
            INSERT INTO Gasto (Descripcion, Monto, Fecha, Categoria, ID_Subcategoria, ID_Usuario, Periodico, ID_Grupo, Periodicidad)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            categoria = "Grupal"
            subcategoria = None
            periodicidad = None
            periodico = 0

            cursor.execute(query_insert_personal, (
                descripcion, monto, fecha, categoria, subcategoria, id_usuario_destino, periodico, grupo_id, periodicidad
            ))

        # Caso: Gasto propio del usuario no administrador
        else:
            estado = "Pagado"
            query_insert_grupal = """
            INSERT INTO Gasto_Grupal (Descripcion, Monto, Fecha, ID_Grupo, ID_Usuario, Estado)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query_insert_grupal, (descripcion, monto, fecha, grupo_id, user_id, estado))

            # Registrar en Gasto personal
            query_insert_personal = """
            INSERT INTO Gasto (Descripcion, Monto, Fecha, Categoria, ID_Subcategoria, ID_Usuario, Periodico, ID_Grupo, Periodicidad)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            categoria = "Grupal"
            subcategoria = None
            periodicidad = None
            periodico = 0

            cursor.execute(query_insert_personal, (
                descripcion, monto, fecha, categoria, subcategoria, user_id, periodico, grupo_id, periodicidad
            ))

        connection.commit()

        return jsonify({"message": "Gasto registrado con éxito."}), 201

    except Exception as e:
        connection.rollback()
        return jsonify({"error": f"Error al registrar el gasto grupal: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()




@app.route('/api/grupo/metas', methods=['POST'], endpoint='metas_grupales')
@jwt_refresh_if_active
def registrar_meta_grupal():
    user_id = get_jwt_identity()
    data = request.json

    descripcion = data.get('descripcion')
    monto_objetivo = data.get('montoObjetivo')
    fecha_inicio = data.get('fechaInicio')
    fecha_limite = data.get('fechaLimite')
    id_grupo = data.get('idGrupo')

    # Validar campos requeridos
    if not descripcion or not monto_objetivo or not fecha_inicio or not fecha_limite or not id_grupo:
        return jsonify({"error": "Faltan datos requeridos"}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Insertar la meta grupal
        query = """
            INSERT INTO Meta_Ahorro_Grupal (Descripcion, Monto_Objetivo, Monto_Actual, Fecha_Inicio, Fecha_Limite, ID_Grupo, ID_Admin)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (descripcion, monto_objetivo, 0, fecha_inicio, fecha_limite, id_grupo, user_id))
        connection.commit()

        return jsonify({"message": "Meta grupal registrada exitosamente"}), 201

    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        connection.close()


@app.route('/api/grupo/<int:grupo_id>/metas', methods=['GET'], endpoint='info_meta_grupal')
@jwt_refresh_if_active
def obtener_metas_grupales(grupo_id):
    """
    Endpoint para obtener todas las metas grupales de un grupo específico.
    """
    user_id = get_jwt_identity()

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar si el usuario pertenece al grupo y está confirmado
        query_verificar = """
        SELECT Confirmado
        FROM Miembro_Grupo
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Obtener las metas grupales
        query_metas = """
        SELECT 
            ID_Ahorro_Grupal,
            Descripcion,
            Monto_Objetivo,
            Monto_Actual,
            Fecha_Inicio,
            Fecha_Limite
        FROM Meta_Ahorro_Grupal
        WHERE ID_Grupo = %s
        """
        cursor.execute(query_metas, (grupo_id,))
        metas = cursor.fetchall()

        # Añadir estatus de ahorro a las metas
        for meta in metas:
            if meta['Monto_Actual'] == meta['Monto_Objetivo']:
                meta['Estatus'] = 'Completado'
            else:
                meta['Estatus'] = 'En curso'

        return jsonify(metas), 200

    except Exception as e:
        return jsonify({"error": f"Error al obtener metas grupales: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()



@app.route('/api/grupo/<int:grupo_id>/agregar-miembros', methods=['POST'], endpoint='agregar_miembro_grupo')
@jwt_refresh_if_active
def agregar_miembros_grupo(grupo_id):
    """
    Endpoint para agregar nuevos miembros a un grupo existente.
    """
    user_id = get_jwt_identity()
    data = request.json
    nuevos_miembros = data.get('miembros', [])

    if not nuevos_miembros:
        return jsonify({"error": "No se proporcionaron correos electrónicos."}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar que el usuario sea administrador del grupo
        query_admin = "SELECT ID_Admin, Nombre_Grupo FROM Grupo WHERE ID_Grupo = %s"
        cursor.execute(query_admin, (grupo_id,))
        grupo = cursor.fetchone()

        if not grupo or grupo['ID_Admin'] != user_id:
            return jsonify({"error": "No tienes permisos para realizar esta acción"}), 403

        nombre_grupo = grupo['Nombre_Grupo']

        # Procesar los nuevos miembros
        for email in nuevos_miembros:
            # Verificar si el usuario ya existe
            cursor.execute("SELECT ID_Usuario FROM Usuario WHERE Email = %s", (email,))
            usuario = cursor.fetchone()
            id_usuario = usuario['ID_Usuario'] if usuario else None

            # Insertar miembro en la tabla Miembro_Grupo
            cursor.execute("""
                INSERT INTO Miembro_Grupo (ID_Usuario, ID_Grupo, Email, Confirmado)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE Confirmado = 0
            """, (id_usuario, grupo_id, email, 0))

            # Enviar correo de invitación
            send_invitation_email(email, grupo_id, nombre_grupo)

        connection.commit()
        return jsonify({"message": "Miembros añadidos exitosamente. Se han enviado las invitaciones."}), 201

    except Exception as e:
        connection.rollback()
        return jsonify({"error": f"Error al agregar miembros: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()


@app.route('/api/gasto/<int:id_gasto>', methods=['GET'], endpoint='obtener_gasto_edit')
@jwt_refresh_if_active
def obtener_gasto(id_gasto):
    user_id = get_jwt_identity()
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)
    query = """
    SELECT ID_Gasto, Descripcion, Monto, Periodicidad, Categoria, Fecha, Periodico, ID_Subcategoria
    FROM Gasto
    WHERE ID_Gasto = %s AND ID_Usuario = %s
    """
    cursor.execute(query, (id_gasto, user_id))
    gasto = cursor.fetchone()

    connection.close()

    if gasto:
        return jsonify(gasto), 200
    else:
        return jsonify({"error": "Gasto no encontrado"}), 404

    


@app.route('/api/gasto/actualizar/<int:id_gasto>', methods=['PUT'], endpoint='actualizar_gasto_edit')
@jwt_refresh_if_active
def actualizar_gasto(id_gasto):
    """
    Endpoint para actualizar un gasto existente en la base de datos.
    """
    user_id = get_jwt_identity()
    data = request.json

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()
        query = """
        UPDATE Gasto
        SET Descripcion = %s, 
            Monto = %s, 
            Periodicidad = %s, 
            Categoria = %s, 
            Fecha = %s, 
            Periodico = %s, 
            ID_Subcategoria = %s
        WHERE ID_Gasto = %s AND ID_Usuario = %s
        """
        cursor.execute(query, (
            data.get('descripcion'),
            data.get('monto'),
            data.get('periodicidad'),
            data.get('categoria'),
            data.get('fecha'),
            data.get('periodico'),
            data.get('id_subcategoria'),
            id_gasto,
            user_id
        ))

        connection.commit()
        return jsonify({"message": "Gasto actualizado con éxito"}), 200

    except Exception as e:
        app.logger.error("Error al actualizar el gasto: %s", str(e))
        return jsonify({"error": "Error al actualizar el gasto"}), 500

    finally:
        connection.close()


@app.route('/api/grupo/<int:grupo_id>/metas/<int:meta_id>', methods=['GET'], endpoint='detalle_meta_grupal')
@jwt_refresh_if_active
def obtener_meta_grupal(grupo_id, meta_id):
    user_id = get_jwt_identity()

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Verificar si el usuario pertenece al grupo
        query_verificar = """
        SELECT Confirmado
        FROM Miembro_Grupo
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro = cursor.fetchone()
        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Obtener la información de la meta grupal
        query_meta = """
        SELECT 
            ID_Ahorro_Grupal AS MetaID,
            Descripcion,
            Monto_Objetivo,
            Monto_Actual,
            Fecha_Inicio,
            Fecha_Limite
        FROM Meta_Ahorro_Grupal
        WHERE ID_Ahorro_Grupal = %s AND ID_Grupo = %s
        """
        cursor.execute(query_meta, (meta_id, grupo_id))
        meta = cursor.fetchone()

        if not meta:
            return jsonify({"error": "Meta no encontrada"}), 404

        # Obtener los aportes relacionados con la meta
        query_aportes = """
        SELECT 
            ID_Aporte,
            ID_Meta_Ahorro,
            Monto_Aporte,
            Fecha_Aporte,
            (SELECT CONCAT(Nombre, ' ', Apellido_P, ' ', Apellido_M)
             FROM Usuario
             WHERE Usuario.ID_Usuario = Aporte_Grupal.ID_Usuario) AS Responsable
        FROM Aporte_Grupal
        WHERE ID_Meta_Ahorro = %s
        """
        cursor.execute(query_aportes, (meta_id,))
        aportes = cursor.fetchall()

        meta["Aportes"] = aportes

        connection.close()
        return jsonify(meta), 200

    except Exception as e:
        connection.close()
        return jsonify({"error": f"Error al obtener la meta grupal: {str(e)}"}), 500



@app.route('/api/grupo/<int:grupo_id>/metas/<int:meta_id>/aportes', methods=['POST'], endpoint='registrar_aporte_grupal')
@jwt_refresh_if_active
def registrar_aporte_grupal(grupo_id, meta_id):
    user_id = get_jwt_identity()
    data = request.json

    print("Datos recibidos del frontend:", data)  # Debug para verificar qué datos llegan del front

    monto = data.get("monto")
    fecha = data.get("fecha")

    if not monto or not fecha:
        return jsonify({"error": "Faltan datos obligatorios (monto, fecha)."}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Verificar si el usuario pertenece al grupo
        query_verificar = """
        SELECT Confirmado
        FROM Miembro_Grupo
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro = cursor.fetchone()
        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Verificar si la meta existe y calcular el monto faltante
        query_meta = """
        SELECT Monto_Objetivo, Monto_Actual
        FROM Meta_Ahorro_Grupal
        WHERE ID_Ahorro_Grupal = %s AND ID_Grupo = %s
        """
        cursor.execute(query_meta, (meta_id, grupo_id))
        meta = cursor.fetchone()

        if not meta:
            return jsonify({"error": "Meta grupal no encontrada"}), 404

        faltante = meta["Monto_Objetivo"] - meta["Monto_Actual"]
        if monto > faltante:
            return jsonify({"error": "El monto del aporte excede el monto faltante para alcanzar la meta."}), 400

        # Registrar el aporte
        query_aporte = """
        INSERT INTO Aporte_Grupal (ID_Meta_Ahorro, ID_Usuario, Monto_Aporte, Fecha_Aporte)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query_aporte, (meta_id, user_id, monto, fecha))

        # Actualizar el monto actual de la meta
        query_update_meta = """
        UPDATE Meta_Ahorro_Grupal
        SET Monto_Actual = Monto_Actual + %s
        WHERE ID_Ahorro_Grupal = %s AND ID_Grupo = %s
        """
        cursor.execute(query_update_meta, (monto, meta_id, grupo_id))

        connection.commit()
        return jsonify({"message": "Aporte registrado exitosamente."}), 201

    except Exception as e:
        connection.rollback()
        print("Error en el servidor:", str(e))  # Debug para errores del servidor
        return jsonify({"error": f"Error al registrar el aporte: {str(e)}"}), 500

    finally:
        connection.close()


@app.route('/api/grupo/<int:grupo_id>/gasto/<int:gasto_id>/reclamar', methods=['PUT'], endpoint='reclamar_gasto')
@jwt_refresh_if_active
def reclamar_gasto(grupo_id, gasto_id):
    """
    Endpoint para que un usuario reclame un gasto grupal como suyo y lo registre como gasto personal.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Verificar que el usuario pertenece al grupo y está confirmado
        query_verificar = """
        SELECT Confirmado 
        FROM Miembro_Grupo 
        WHERE ID_Usuario = %s AND ID_Grupo = %s AND Confirmado = 1
        """
        cursor.execute(query_verificar, (user_id, grupo_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "No tienes acceso a este grupo"}), 403

        # Verificar que el gasto existe y aún está "pendiente"
        query_gasto = """
        SELECT ID_Gasto_Grupal, Estado, ID_Usuario, Descripcion, Monto, Fecha
        FROM Gasto_Grupal
        WHERE ID_Gasto_Grupal = %s AND ID_Grupo = %s
        """
        cursor.execute(query_gasto, (gasto_id, grupo_id))
        gasto = cursor.fetchone()

        if not gasto:
            return jsonify({"error": "Gasto no encontrado"}), 404

        if gasto['Estado'] != 'Pendiente' or gasto['ID_Usuario'] is not None:
            return jsonify({"error": "Este gasto ya ha sido reclamado o no está pendiente."}), 400

        # Actualizar el gasto grupal para asignarlo al usuario
        query_actualizar = """
        UPDATE Gasto_Grupal
        SET ID_Usuario = %s, Estado = 'Pagado'
        WHERE ID_Gasto_Grupal = %s AND ID_Grupo = %s
        """
        cursor.execute(query_actualizar, (user_id, gasto_id, grupo_id))

        # Insertar el gasto en la tabla de Gasto personal
        query_insert_personal = """
        INSERT INTO Gasto (Descripcion, Monto, Fecha, Categoria, ID_Subcategoria, ID_Usuario, Periodico, ID_Grupo, Periodicidad)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        descripcion = gasto['Descripcion']
        monto = gasto['Monto']
        fecha = gasto['Fecha']
        categoria = "Grupal"
        subcategoria = None  # Si no hay subcategorías
        periodicidad = None  # No aplica periodicidad para este caso
        periodico = 0  # No es periódico

        cursor.execute(query_insert_personal, (
            descripcion, monto, fecha, categoria, subcategoria, user_id, periodico, grupo_id, periodicidad
        ))

        connection.commit()

        return jsonify({"message": "Gasto reclamado y registrado como gasto personal exitosamente"}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({"error": f"Error al reclamar el gasto: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()




@app.route('/api/user/info', methods=['GET'], endpoint='get_user_info')
@jwt_refresh_if_active
def get_user_info():
    """
    Endpoint para obtener toda la información del usuario autenticado.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Consulta para obtener la información del usuario
        query = """
        SELECT 
            ID_Usuario,
            Nombre,
            Apellido_P,
            Apellido_M,
            Email,
            Fecha_Cumple,
            Contacto,
            Estado_ID,
            email_verificado
        FROM Usuario
        WHERE ID_Usuario = %s
        """
        cursor.execute(query, (user_id,))
        user_info = cursor.fetchone()

        if not user_info:
            return jsonify({"error": "Usuario no encontrado"}), 404

        # Cerrar la conexión y devolver los datos
        return jsonify(user_info), 200

    except Exception as e:
        return jsonify({"error": f"Error al obtener la información del usuario: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()


@app.route('/api/user/edit', methods=['PUT'], endpoint='editar_usuario')
@jwt_refresh_if_active
def editar_usuario():
    """
    Endpoint para editar la información de un usuario autenticado.
    """
    user_id = get_jwt_identity()
    data = request.json

    # Validar datos
    nombre = data.get('Nombre')
    apellido_p = data.get('Apellido_P')
    apellido_m = data.get('Apellido_M', '')
    fecha_cumple = data.get('Fecha_Cumple')
    contacto = data.get('Contacto')

    if not all([nombre, apellido_p, fecha_cumple]):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    try:
        # Conexión a la base de datos
        connection = create_connection()
        if connection is None:
            return jsonify({"error": "Error al conectar a la base de datos"}), 500

        cursor = connection.cursor()

        # Actualizar la información del usuario
        query = """
        UPDATE Usuario
        SET Nombre = %s, Apellido_P = %s, Apellido_M = %s, Fecha_Cumple = %s, Contacto = %s
        WHERE ID_Usuario = %s
        """
        cursor.execute(query, (nombre, apellido_p, apellido_m, fecha_cumple, contacto, user_id))
        connection.commit()

        return jsonify({"message": "Información actualizada con éxito"}), 200

    except Exception as e:
        return jsonify({"error": f"Error al actualizar la información: {str(e)}"}), 500

    finally:
        if 'connection' in locals() and connection is not None:
            connection.close()

@app.route('/api/user/deactivate', methods=['PUT'], endpoint='deactivate_user')
@jwt_refresh_if_active
def deactivate_user():
    """
    Endpoint para desactivar la cuenta del usuario autenticado (cambiar Estado_ID a 0).
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT

    # Conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()

        # Actualizar el campo Estado_ID a 0
        query = "UPDATE Usuario SET Estado_ID = 0 WHERE ID_Usuario = %s"
        cursor.execute(query, (user_id,))

        # Confirmar los cambios
        connection.commit()

        # Cerrar la conexión y devolver la respuesta
        return jsonify({"message": "Cuenta desactivada exitosamente."}), 200

    except Exception as e:
        # Si ocurre un error, realizar rollback y retornar el error
        connection.rollback()
        return jsonify({"error": f"Error al desactivar la cuenta: {str(e)}"}), 500

    finally:
        if 'connection' in locals() and connection is not None:
            connection.close()


@app.route('/api/user/change_email', methods=['PUT'], endpoint='change_email')
@jwt_refresh_if_active
def change_email():
    """
    Endpoint para cambiar el correo electrónico del usuario autenticado.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado
    data = request.json
    new_email = data.get('new_email')

    if not new_email:
        return jsonify({"error": "El nuevo correo electrónico es obligatorio."}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Verificar si el correo ya existe en la base de datos
        query_check = "SELECT ID_Usuario FROM Usuario WHERE Email = %s"
        cursor.execute(query_check, (new_email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({"error": "El correo electrónico ya está en uso."}), 409

        # Actualizar el correo en la tabla Usuario
        query_update = "UPDATE Usuario SET Email = %s, email_verificado = 0 WHERE ID_Usuario = %s"
        cursor.execute(query_update, (new_email, user_id))
        connection.commit()

        # Generar un nuevo token de verificación de correo
        token = s.dumps(new_email, salt='email-confirm')
        confirm_url = url_for('confirm_email', token=token, _external=True)

        # Enviar correo de verificación
        html_body = f"""
        <p>Por favor, verifica tu nuevo correo electrónico haciendo clic <a href="{confirm_url}">AQUI</a>.</p>
        """
        msg = Message('Verifica tu nuevo correo', sender='fianzastt@gmail.com', recipients=[new_email])
        msg.html = html_body
        mail.send(msg)

        return jsonify({"message": "Correo actualizado. Por favor, verifica tu nuevo correo."}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({"error": f"Error al actualizar el correo: {str(e)}"}), 500

    finally:
        connection.close()


@app.route('/api/user/change_password', methods=['PUT'], endpoint='change_password')
@jwt_refresh_if_active
def change_password():
    """
    Endpoint para cambiar la contraseña del usuario autenticado.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado
    data = request.json
    print(f"Datos recibidos: {data}")  # Esto imprimirá los datos recibidos
    new_password = data.get('new_password')

    if not new_password:
        return jsonify({"error": "La nueva contraseña es obligatoria."}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()

        # Actualizar la contraseña en la tabla Usuario
        query_update = "UPDATE Usuario SET Contraseña = %s WHERE ID_Usuario = %s"
        cursor.execute(query_update, (new_password, user_id))
        connection.commit()

        return jsonify({"message": "Contraseña actualizada exitosamente. Por favor, inicia sesión nuevamente."}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({"error": f"Error al actualizar la contraseña: {str(e)}"}), 500

    finally:
        connection.close()

@app.route('/api/grupo/<int:grupo_id>', methods=['DELETE'], endpoint='delete_group')
@jwt_refresh_if_active
def delete_group(grupo_id):
    """
    Endpoint para eliminar un grupo por su ID.
    """
    user_id = get_jwt_identity()  # Usuario autenticado
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Verificar si el usuario es el administrador del grupo
        query_check_admin = "SELECT ID_Admin FROM Grupo WHERE ID_Grupo = %s"
        cursor.execute(query_check_admin, (grupo_id,))
        result = cursor.fetchone()

        if not result or result['ID_Admin'] != user_id:
            return jsonify({"error": "No tienes permiso para eliminar este grupo"}), 403

        # Eliminar el grupo
        query_delete_group = "DELETE FROM Grupo WHERE ID_Grupo = %s"
        cursor.execute(query_delete_group, (grupo_id,))
        connection.commit()

        return jsonify({"message": "Grupo eliminado exitosamente"}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({"error": f"Error al eliminar el grupo: {str(e)}"}), 500

    finally:
        connection.close()


@app.route('/api/grupo/<int:grupo_id>/cambiar-admin', methods=['PUT'], endpoint='change_admin')
@jwt_refresh_if_active
def change_admin(grupo_id):
    """
    Endpoint para cambiar el administrador de un grupo.
    """
    user_id = get_jwt_identity()  # Obtener el ID del usuario autenticado
    data = request.json
    new_admin_id = data.get('new_admin_id')

    if not new_admin_id:
        return jsonify({"error": "El ID del nuevo administrador es obligatorio."}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Verificar si el usuario autenticado es el administrador actual del grupo
        query_check_admin = "SELECT ID_Admin FROM Grupo WHERE ID_Grupo = %s"
        cursor.execute(query_check_admin, (grupo_id,))
        grupo = cursor.fetchone()

        if not grupo:
            return jsonify({"error": "El grupo no existe."}), 404

        if grupo['ID_Admin'] != user_id:
            return jsonify({"error": "No tienes permisos para cambiar el administrador del grupo."}), 403

        # Verificar que el nuevo administrador es un miembro confirmado del grupo
        query_check_member = """
        SELECT ID_Usuario 
        FROM Miembro_Grupo 
        WHERE ID_Grupo = %s AND ID_Usuario = %s AND Confirmado = 1
        """
        cursor.execute(query_check_member, (grupo_id, new_admin_id))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "El nuevo administrador debe ser un miembro confirmado del grupo."}), 400

        # Actualizar el administrador del grupo
        query_update_admin = "UPDATE Grupo SET ID_Admin = %s WHERE ID_Grupo = %s"
        cursor.execute(query_update_admin, (new_admin_id, grupo_id))
        connection.commit()

        return jsonify({"message": "El administrador del grupo ha sido actualizado exitosamente."}), 200

    except Exception as e:
        connection.rollback()
        return jsonify({"error": f"Error al cambiar el administrador: {str(e)}"}), 500

    finally:
        if 'connection' in locals() and connection is not None:
            connection.close()



@app.route('/api/grupo/unirse', methods=['POST'], endpoint='unirse_grupo')
@jwt_refresh_if_active
def unirse_grupo():
    # Obtener datos del cuerpo de la solicitud
    data = request.json
    codigo_invitacion = data.get('codigo_invitacion')
    user_id = get_jwt_identity()

    if not codigo_invitacion:
        return jsonify({"error": "El código de invitación es obligatorio."}), 400

    # Crear conexión a la base de datos
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos."}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Obtener el email del usuario autenticado
        query_user = "SELECT Email FROM Usuario WHERE ID_Usuario = %s"
        cursor.execute(query_user, (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "No se encontró información del usuario autenticado."}), 404

        email_usuario = user['Email']

        # Verificar si el grupo con el código de invitación existe
        query_grupo = "SELECT * FROM Grupo WHERE Codigo_Invitacion = %s"
        cursor.execute(query_grupo, (codigo_invitacion,))
        grupo = cursor.fetchone()

        if not grupo:
            return jsonify({"error": "El código de invitación no es válido."}), 404

        # Verificar si el usuario ya es miembro del grupo
        query_miembro = """
        SELECT * FROM Miembro_Grupo 
        WHERE ID_Usuario = %s AND ID_Grupo = %s
        """
        cursor.execute(query_miembro, (user_id, grupo['ID_Grupo']))
        miembro_existente = cursor.fetchone()

        if miembro_existente:
            return jsonify({"error": "Ya eres miembro de este grupo."}), 400

        # Insertar al usuario en la tabla Miembro_Grupo con Confirmado = 0 y su email
        query_insert = """
        INSERT INTO Miembro_Grupo (ID_Usuario, ID_Grupo, Email, Confirmado)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query_insert, (user_id, grupo['ID_Grupo'], email_usuario, 0))
        connection.commit()

        # Obtener información del administrador del grupo
        query_admin = "SELECT Email, Nombre FROM Usuario WHERE ID_Usuario = %s"
        cursor.execute(query_admin, (grupo['ID_Admin'],))
        admin = cursor.fetchone()

        if not admin:
            return jsonify({"error": "No se pudo encontrar al administrador del grupo."}), 500

        # Enviar correo al administrador del grupo
        try:
            # Cambiar miembro_id por ID_Grupo e ID_Usuario
            aceptar_url = f"http://127.0.0.1:5000/api/grupo/aceptar_solicitud?ID_Grupo={grupo['ID_Grupo']}&ID_Usuario={user_id}"
            msg = Message(
                subject="Solicitud para unirse a tu grupo",
                sender="fianzastt@gmail.com",
                recipients=[admin['Email']],
            )
            msg.body = f"""
            Hola {admin['Nombre']},

            El usuario con correo {email_usuario} ha solicitado unirse al grupo '{grupo['Nombre_Grupo']}'.

            Haz clic en el siguiente enlace para aceptar la solicitud:
            {aceptar_url}
            """
            mail.send(msg)
        except Exception as e:
            print(f"Error al enviar el correo: {str(e)}")
            return jsonify({"error": "No se pudo enviar el correo al administrador."}), 500

        return jsonify({"message": "Solicitud enviada. El administrador revisará tu solicitud."}), 201

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "Error interno del servidor."}), 500

    finally:
        cursor.close()
        connection.close()




@app.route('/api/grupo/aceptar_solicitud', methods=['GET'], endpoint='aceptar_solicitud')
def aceptar_solicitud():
    id_grupo = request.args.get('ID_Grupo')
    id_usuario = request.args.get('ID_Usuario')

    if not id_grupo or not id_usuario:
        return jsonify({"error": "ID del grupo y ID del usuario son obligatorios."}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos."}), 500

    cursor = connection.cursor()

    try:
        # Validar que el usuario ya está registrado en el grupo
        query_validate = """
        SELECT * FROM Miembro_Grupo
        WHERE ID_Usuario = %s AND ID_Grupo = %s
        """
        cursor.execute(query_validate, (id_usuario, id_grupo))
        miembro = cursor.fetchone()

        if not miembro:
            return jsonify({"error": "El usuario no está registrado en este grupo."}), 404

        # Actualizar el campo Confirmado a 1
        query_update = """
        UPDATE Miembro_Grupo
        SET Confirmado = 1
        WHERE ID_Usuario = %s AND ID_Grupo = %s
        """
        cursor.execute(query_update, (id_usuario, id_grupo))
        connection.commit()

        return jsonify({"message": "Solicitud aceptada exitosamente."}), 200

    except Exception as e:
        connection.rollback()
        print(f"Error al aceptar la solicitud: {str(e)}")
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

    finally:
        cursor.close()
        connection.close()


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({"error": "El correo es obligatorio"}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor(dictionary=True)

        # Verificar si el correo existe
        query = "SELECT ID_Usuario FROM Usuario WHERE Email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "El correo no está registrado"}), 404

        # Generar un código de verificación
        verification_code = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        expiration_time = datetime.now() + timedelta(minutes=15)

        # Guardar el código en memoria
        verification_codes[email] = {
            "code": verification_code,
            "expires_at": expiration_time
        }

        # Enviar el código al correo
        msg = Message(
            subject="Código de recuperación de contraseña",
            sender="fianzastt@gmail.com",
            recipients=[email],
            body=f"Tu código de verificación es: {verification_code}. Este código expira en 15 minutos."
        )
        mail.send(msg)

        return jsonify({"message": "Código de verificación enviado"}), 200

    except Exception as e:
        print(f"Error interno del servidor: {str(e)}")
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

    finally:
        connection.close()



@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({"error": "Correo y código son obligatorios"}), 400

    # Verificar si hay un código para este correo
    if email not in verification_codes:
        return jsonify({"error": "No se encontró un código para este correo"}), 404

    stored_code = verification_codes[email]

    # Verificar si el código ha expirado
    if datetime.now() > stored_code["expires_at"]:
        del verification_codes[email]  # Eliminar el código expirado
        return jsonify({"error": "El código ha expirado"}), 400

    # Verificar si el código coincide
    if code != stored_code["code"]:
        return jsonify({"error": "El código es incorrecto"}), 400

    # Eliminar el código después de la verificación
    del verification_codes[email]

    return jsonify({"message": "Código verificado"}), 200



@app.route('/api/update-password', methods=['POST'])
def update_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')

    if not email or not new_password:
        return jsonify({"error": "Correo y nueva contraseña son obligatorios"}), 400

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    try:
        cursor = connection.cursor()

        # Actualizar la contraseña
        query = "UPDATE Usuario SET Contraseña = %s WHERE Email = %s"
        cursor.execute(query, (new_password, email))
        connection.commit()

        return jsonify({"message": "Contraseña actualizada"}), 200

    except Exception as e:
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

    finally:
        connection.close()





if __name__ == '__main__':
    app.run(debug=True)

