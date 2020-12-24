const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utilitades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {

        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }

        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSalas(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `${ data.nombre } se unió`));

        callback(usuarios.getPersonasPorSalas(data.sala));

    });

    client.on('crearMensaje', (data, callback) => {

        let persona = usuarios.getPersona(client.id)[0];

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje);

    });

    client.on('disconnect', () => {

        let personaBorrada = usuarios.borrarPersona(client.id)[0];

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${ personaBorrada.nombre } salió`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSalas(personaBorrada.sala));

    });

    // Mensajes privados
    client.on('mensajePrivado', data => {

        let persona = usuarios.getPersona(client.id)[0];
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

    });

});