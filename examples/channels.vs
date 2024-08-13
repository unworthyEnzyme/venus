let sender = fun(message_channel) {
    message_channel <- 42;
};
let message_channel = Channel(0);
spawn sender(message_channel);
let message = <-message_channel;
print message;
