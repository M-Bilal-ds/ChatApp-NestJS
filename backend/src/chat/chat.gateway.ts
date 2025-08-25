import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';

interface ChatMessage {
    username: string;
    message: string;
    timestamp: Date;
}

@WebSocketGateway({
    cors: {
        origin: "*",
        credentials: true
    }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private users = new Map<string, string>();
    
    handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    }

    handleDisconnect(client: Socket) {
        const username = this.users.get(client.id);
        if (username) {
            this.users.delete(client.id);
            client.broadcast.emit('userDisconnected', username);
        }
        console.log('Client disconnected:', client.id);
    }
    
    @SubscribeMessage('joinChat')
        handleJoinChat(
            @MessageBody() data:{ username: string },
            @ConnectedSocket() client: Socket
        ) {
            this.users.set(client.id, data.username);
            client.broadcast.emit('userJoined', {username: data.username});
            const userList = Array.from(this.users.values());
            client.emit('userList', userList);
            return { success: true };
        }
        
    @SubscribeMessage('sendMessage')
        handleMessage(
            @MessageBody() data: { message: string },
            @ConnectedSocket() client: Socket
        ) {
            const username = this.users.get(client.id);
            if (!username) {
                return { error: 'User not found!' };
            }
            const chatMessage: ChatMessage = {
                username,
                message: data.message,
                timestamp: new Date(),
            };
            client.broadcast.emit('newMessage', chatMessage);
            client.emit('newMessage', chatMessage);
            return { success: true };
        }
}