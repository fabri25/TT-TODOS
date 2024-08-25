from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta


app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas y dominios

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


from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

# FUNCION PARA INICIO DE SESION CON VALIDACION DE INGRESOS TAB
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
        # Obtener el ID del usuario
        user_id = user['ID_Usuario']
        print(f"ID del usuario: {user_id}")
        
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
                "user": user,
                "hasIncome": hasIncome,  # Indicar que no tiene ingresos
                "showFloatingTabIncome": False,
                "showFloatingTab": True  # Mostrar la ventana para capturar los ingresos iniciales
            }), 200
    else:
        connection.close()
        print("Correo o contraseña incorrectos.")
        return jsonify({"error": "Correo o contraseña incorrectos"}), 401





    pass


#FUNCION DE REGISTRO DE USUARIOS
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

    connection.close()

    return jsonify({"message": "Usuario registrado exitosamente"}), 201

#FUNCION PARA CAPTURAR INGRESOS POR PRIMERA VEZ O ACTUALIZAR INGRESOS EXISTENTES
@app.route('/api/ingreso', methods=['POST'])
def agregar_ingreso():
    data = request.json
    id_usuario = data.get('id_usuario')
    monto = data.get('monto')
    descripcion = data.get('descripcion')
    fecha = datetime.now().date()  # Fecha actual

    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor()

    # Verificar si es una actualización de ingreso existente
    if 'periodicidad' in data and 'esFijo' in data and 'tipo' in data:
        # Es un nuevo ingreso (Primera vez)
        periodicidad = data.get('periodicidad')
        es_fijo = data.get('esFijo')
        tipo = data.get('tipo')
        
        query = """
        INSERT INTO Ingreso (Descripcion, Monto, Fecha, Tipo, ID_Usuario, Periodicidad, EsFijo, EsPeriodico)
        VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
        """
        cursor.execute(query, (descripcion, monto, fecha, tipo, id_usuario, periodicidad, es_fijo))
    else:
        # Es una actualización de un ingreso existente
        query = """
        INSERT INTO Ingreso (Descripcion, Monto, Fecha, Tipo, ID_Usuario, Periodicidad, EsFijo, EsPeriodico)
        SELECT Descripcion, %s, %s, Tipo, ID_Usuario, Periodicidad, EsFijo, EsPeriodico
        FROM Ingreso
        WHERE ID_Usuario = %s AND Descripcion = %s
        LIMIT 1
        """
        cursor.execute(query, (monto, fecha, id_usuario, descripcion))
    
    connection.commit()
    connection.close()

    return jsonify({"message": "Ingreso registrado exitosamente"}), 201




if __name__ == '__main__':
    app.run(debug=True)
