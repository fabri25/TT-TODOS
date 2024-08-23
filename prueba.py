import mysql.connector
from mysql.connector import Error

def create_connection():
    try:
        connection = mysql.connector.connect(
            host='34.136.136.216',  
            user='root',  
            password='tt-finance1',  
            database='gestion_financiera'  
        )
        if connection.is_connected():
            print("Conexión exitosa a la base de datos")
            return connection
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None

def create_user(connection, nombre, apellido_p, apellido_m, email, contraseña, estado_id):
    try:
        cursor = connection.cursor()
        query = """
        INSERT INTO Usuario (Nombre, Apellido_P, Apellido_M, Email, Contraseña, Estado_ID)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (nombre, apellido_p, apellido_m, email, contraseña, estado_id)
        cursor.execute(query, values)
        connection.commit()
        print(f"Usuario '{nombre} {apellido_p}' creado exitosamente.")
    except Error as e:
        print(f"Error al crear el usuario: {e}")

def main():
    # Crear conexión a la base de datos
    connection = create_connection()

    if connection:
        # Datos del nuevo usuario
        nombre = "Fabrizio"
        apellido_p = "Campos"
        apellido_m = "Duran"
        email = "fabricio15duran@gmail.com"
        contraseña = "olafeos1234"
        estado_id = 1  # Asegúrate de que este ID exista en la tabla Estado_Usuario

        # Crear el usuario
        create_user(connection, nombre, apellido_p, apellido_m, email, contraseña, estado_id)

        # Cerrar la conexión
        connection.close()

if __name__ == "__main__":
    main()
