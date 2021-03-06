const command = require('./command');
const event = require('./event');
const map = require('./map');
const emoji = require('./emoji');

// Редьюсер текстовых команд
exports.router = (msg) => {

    // Если прислали фото, подставляем msg.txt что бы роутинг продолжал работать
    if (msg.hasOwnProperty('photo')){
        msg.text = 'Фотография';
    }

    // Декодируем эмодзи
    msg.text = emoji.decode(msg.text);

    // Нет состояния  у пользователя, отдаем главное меню
    if (!event.state.hasOwnProperty(msg.from.id)){
        command.emit('/home', msg);

        // добавляем пользователя в state
        event.state[msg.from.id] = [];
    } else {

        // Переход в нужную ветку
        const reducer = event.state[msg.from.id].reduce((path, item) => {

            // Если нет дочерних разделов
            if (!path.children){
                return path;
            } else {

                if (path.children.hasOwnProperty(item)){
                    return path.children[item]
                } else {
                    // Если нет подходящей ветки, то пытаемся использовать общую ветку
                    if (path.children.hasOwnProperty('*')){
                        return path.children['*'];
                    } else {
                        return path;
                    }
                }
            }
        }, map);

        // проверяем существование метода
        if (reducer.children.hasOwnProperty(msg.text)){
            let action = reducer.children[msg.text];

            // Вызов действия
            event.event.emit(action.event, msg, action, (value = msg.text) => {
                event.event.emit('location:next', msg, action, value)
            })

        } else {

            // Если нет подходящей ветки, то пытаемся использовать общую ветку
            if (reducer.children.hasOwnProperty('*')){
                let action = reducer.children['*'];

                // Вызов действия
                event.event.emit(action.event, msg, action, (value = msg.text) => {
                    event.event.emit('location:next', msg, action, value)
                })
            }
        }

        // trace
        setTimeout(() => console.log(event.state[msg.from.id]), 1000)
    }
};


// Команды bot
exports.command = (msg) => {

    // При выполнении bot-команд, необходимо
    // очищать состояние пользователя
    event.state[msg.from.id] = [];

    switch (msg.text){

        // Приветствие новых пользователей
        case '/start':
            command.emit('/start', msg);
            break;

        // Главное меню
        case '/home':
            command.emit('/home', msg);
            break;

        default:
            // Игнорируем остальное
            break;
    }
};