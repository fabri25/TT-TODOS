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

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas y dominios

# Configuración de claves secretas para Flask y JWT
app.config['SECRET_KEY'] = secrets.token_urlsafe(16)  # Clave para Flask (session)
app.config['JWT_SECRET_KEY'] = secrets.token_urlsafe(32)  # Clave para JWT

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

def create_connection():
    connection = None
    try:
        connection = mysql.connector.connect(
            host='34.136.136.216',  
            user='root',  
            password='tt-finance1',  
            database='gestion_financiera'  
        )
        return connection
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None

# FUNCION PARA INICIO DE SESION CON VALIDACION DE INGRESOS TAB Y JWT
@app.route('/api/login', methods=['POST'])
def login():
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

        # Verificar si el usuario tiene ingresos registrados
        query_income = """
        SELECT ID_Ingreso, Descripcion, Monto, Fecha, Periodicidad, EsFijo 
        FROM Ingreso 
        WHERE ID_Usuario = %s
        """
        cursor.execute(query_income, (user_id,))
        incomes = cursor.fetchall()

        if incomes:
            mostrar_tab_periodo = False
            descripcion = None
            fecha_ultimo_ingreso = None

            # Establecer hasIncome en True porque ya tiene ingresos registrados
            hasIncome = True
            print(f"El usuario tiene {len(incomes)} ingresos registrados.")

            # Agrupar ingresos no fijos por descripción y seleccionar el más reciente
            ingresos_no_fijos = {}
            for income in incomes:
                if income['EsFijo'] == 0:
                    descripcion = income['Descripcion']
                    if descripcion not in ingresos_no_fijos or income['Fecha'] > ingresos_no_fijos[descripcion]['Fecha']:
                        ingresos_no_fijos[descripcion] = income

            # Verificar si hay ingresos no fijos registrados
            if not ingresos_no_fijos:
                connection.close()
                print("No tiene ingresos no fijos, no se mostrará ninguna ventana flotante.")
                return jsonify({
                    "message": "Login exitoso",
                    "token": access_token,  # Retornar el token en la respuesta
                    "user": user,
                    "hasIncome": hasIncome,
                    "showFloatingTabIncome": False,
                    "showFloatingTab": False
                }), 200

            # Verificar cada ingreso no fijo para determinar si se debe mostrar la ventana flotante de periodicidad
            for descripcion, income in ingresos_no_fijos.items():
                fecha_ultimo_ingreso = income['Fecha']
                periodicidad = income['Periodicidad']

                print(f"Fecha del último ingreso para {descripcion}: {fecha_ultimo_ingreso}")
                print(f"Periodicidad: {periodicidad}")
                    
                # Determinar la fecha de comparación en base a la periodicidad
                if periodicidad == 'Diario':
                    fecha_siguiente_ingreso = fecha_ultimo_ingreso + timedelta(days=1)
                elif periodicidad == 'Semanal':
                    fecha_siguiente_ingreso = fecha_ultimo_ingreso + timedelta(weeks=1)
                elif periodicidad == 'Quincenal':
                    fecha_siguiente_ingreso = fecha_ultimo_ingreso + timedelta(weeks=2)
                elif periodicidad == 'Mensual':
                    fecha_siguiente_ingreso = fecha_ultimo_ingreso + relativedelta(months=1)

                fecha_actual = datetime.now().date()
                print(f"Fecha actual: {fecha_actual}")
                print(f"Fecha siguiente ingreso para {descripcion}: {fecha_siguiente_ingreso}")

                if fecha_actual >= fecha_siguiente_ingreso:
                    mostrar_tab_periodo = True
                    break  # Si se debe mostrar la ventana de periodo, no es necesario seguir iterando

            connection.close()

            if mostrar_tab_periodo:
                print("Mostrar ventana flotante para actualizar ingreso según el periodo.")
                return jsonify({
                    "message": "Login exitoso",
                    "token": access_token,  # Retornar el token en la respuesta
                    "user": user,
                    "hasIncome": hasIncome,  # Indicar que tiene ingresos
                    "showFloatingTabIncome": True,
                    "descripcionIngreso": descripcion,
                    "fechaUltimoIngreso": fecha_ultimo_ingreso.strftime('%d/%m/%Y')
                }), 200
            else:
                print("No se mostrará ninguna ventana flotante.")
                return jsonify({
                    "message": "Login exitoso",
                    "token": access_token,  # Retornar el token en la respuesta
                    "user": user,
                    "hasIncome": hasIncome,  # Indicar que tiene ingresos
                    "showFloatingTabIncome": False,
                    "showFloatingTab": False  # No mostrar la tab de captura inicial si ya tiene ingresos
                }), 200
        else:
            # Si no tiene ningún ingreso registrado, se debe mostrar la ventana para capturar ingresos iniciales
            hasIncome = False
            connection.close()
            print("No tiene ingresos registrados, mostrar ventana para capturar ingresos iniciales.")
            return jsonify({
                "message": "Login exitoso",
                "token": access_token,  # Retornar el token en la respuesta
                "user": user,
                "hasIncome": hasIncome,  # Indicar que no tiene ingresos
                "showFloatingTabIncome": False,
                "showFloatingTab": True  # Mostrar la ventana para capturar los ingresos iniciales
            }), 200
    else:
        connection.close()
        print("Correo o contraseña incorrectos.")
        return jsonify({"error": "Correo o contraseña incorrectos"}), 401

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
                window.location.href = "http://localhost:3000/email-verified";
            </script>
        </body>
    </html>
    ''', 200

@app.route('/api/ingreso', methods=['POST'])
@jwt_required()
def agregar_ingreso():
    data = request.json
    id_usuario = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT
    monto = data.get('monto')
    descripcion = data.get('descripcion')
    fecha = datetime.now().date()  # Fecha actual

    # Mensaje para verificar los datos recibidos
    print(f"Datos recibidos para agregar ingreso: {data}")
    print(f"ID Usuario: {id_usuario}, Descripción: {descripcion}, Monto: {monto}, Fecha: {fecha}")

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor()

    # Verificar si llega el campo es_periodico, si no llega, lo tomamos como True por defecto
    es_periodico = data.get('es_periodico', True)

    # Si es_periodico es False, entonces Periodicidad y EsFijo deben ser NULL
    if not es_periodico:
        periodicidad = None
        es_fijo = None
    else:
        # Si es_periodico es True, extraemos los valores de periodicidad y esFijo
        periodicidad = data.get('periodicidad')
        es_fijo = data.get('esFijo')

    tipo = data.get('tipo')

    # Verificar si es un nuevo ingreso (Primera vez)
    if descripcion and monto and tipo:
        print(f"Datos para insertar: Periodicidad: {periodicidad}, EsFijo: {es_fijo}, Tipo: {tipo}, EsPeriodico: {es_periodico}")

        query = """
        INSERT INTO Ingreso (Descripcion, Monto, Fecha, Tipo, ID_Usuario, Periodicidad, EsFijo, EsPeriodico)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (descripcion, monto, fecha, tipo, id_usuario, periodicidad, es_fijo, es_periodico))
    else:
        # Si alguno de los valores requeridos no está, devolvemos un error
        return jsonify({"error": "Faltan datos obligatorios como descripción, monto o tipo"}), 400

    connection.commit()
    
    # Verificar si el ingreso se insertó correctamente
    print(f"Ingreso registrado para el usuario {id_usuario} con descripción {descripcion} y monto {monto}")
    
    connection.close()

    return jsonify({"message": "Ingreso registrado exitosamente"}), 201





# RUTA PARA OBTENER INGRESOS FILTRADOS
@app.route('/api/income/filtered', methods=['POST'])
@jwt_required()
def obtener_ingresos_filtrados():
    user_id = get_jwt_identity()  # Obtener el ID del usuario desde el token JWT
    data = request.json
    tipo = data.get('tipo')
    es_fijo = data.get('esFijo')  # Recibir el filtro de fijo/no fijo
    periodicidad = data.get('periodicidad')
    fecha_inicio = data.get('fecha_inicio')
    fecha_fin = data.get('fecha_fin')

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)

    # Construir la consulta SQL
    query = """
    SELECT Descripcion, SUM(Monto) as Monto
    FROM Ingreso
    WHERE ID_Usuario = %s
    """
    params = [user_id]

    if tipo:
        query += " AND Tipo = %s"
        params.append(tipo)
    
    if es_fijo is not None:  # Manejar el filtro de fijo/no fijo
        query += " AND EsFijo = %s"
        params.append(1 if es_fijo == 'fijo' else 0)

    if periodicidad:
        query += " AND Periodicidad = %s"
        params.append(periodicidad)

    if fecha_inicio and fecha_fin:
        query += " AND Fecha BETWEEN %s AND %s"
        params.append(fecha_inicio)
        params.append(fecha_fin)

    query += " GROUP BY Descripcion"

    cursor.execute(query, params)
    ingresos = cursor.fetchall()

    connection.close()

    return jsonify(ingresos), 200

# RUTA PARA OBTENER INGRESOS PARA TABLA
@app.route('/api/user/incomes', methods=['GET'])
@jwt_required()
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
@app.route('/api/user/incomes/<int:income_id>', methods=['DELETE'])
@jwt_required()
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


@app.route('/api/user/update_income/<int:id_ingreso>', methods=['PUT'])
@jwt_required()
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




@app.route('/api/user/income/<int:id_ingreso>', methods=['GET'])
@jwt_required()
def get_income_by_id(id_ingreso):
    user_id = get_jwt_identity()

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)
    query = """
    SELECT ID_Ingreso, Descripcion, Monto, Periodicidad, EsFijo, Tipo, Fecha
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



if __name__ == '__main__':
    app.run(debug=True)
