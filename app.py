from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

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

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json  # Asegúrate de que Flask está intentando leer la solicitud como JSON
    print(f"Datos recibidos: {data}")  # Esto debería mostrar los datos en la consola

    if data is None:
        return jsonify({"error": "No se recibieron datos"}), 400  # Devolver error si no se recibieron datos

    email = data.get('email')
    password = data.get('password')
    
    connection = create_connection()
    if connection is None:
        return jsonify({"error": "Error al conectar a la base de datos"}), 500
    
    cursor = connection.cursor(dictionary=True)
    query = "SELECT * FROM Usuario WHERE Email = %s AND Contraseña = %s"
    cursor.execute(query, (email, password))
    user = cursor.fetchone()
    
    connection.close()

    if user:
        print("Login exitoso")
        return jsonify({"message": "Login exitoso", "user": user}), 200
    else:
        print("Login fallido: Correo o contraseña incorrectos")
        return jsonify({"error": "Correo o contraseña incorrectos"}), 401
    pass




if __name__ == '__main__':
    app.run(debug=True)
