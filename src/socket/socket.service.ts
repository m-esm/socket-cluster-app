import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClient } from 'redis';

import { SocketGateway } from './socket.gateway';

@Injectable()
export class SocketService implements OnModuleInit, OnModuleDestroy {
  public redisClient: RedisClient;
  public publisherClient: RedisClient;
  private subscriberClient: RedisClient;
  private discoveryInterval;
  private serviceId: string;

  constructor(private readonly socketGateway: SocketGateway) {
    this.serviceId = 'SOCKET_CHANNEL_' + Math.random()
      .toString(26)
      .slice(2);

      setInterval(() => {
        this.sendMessage(
          'user1',
          new Date().toLocaleTimeString() +
            ` | from server on port ${process.env['PORT']}`,
          false,
        );
      }, 3000);
  }

  async onModuleInit() {

    this.redisClient = await this.newRedisClient();
    this.subscriberClient = await this.newRedisClient();
    this.publisherClient = await this.newRedisClient();

    this.subscriberClient.subscribe(  this.serviceId);

    this.subscriberClient.on('message', (channel, message) => {
      const { userId, payload } = JSON.parse(message);
      this.sendMessage(userId, payload, true);
    });

    await this.channelDiscovery();
  }
  private async newRedisClient() {
    return createClient({
      host: 'localhost',
      port: 6379,
    });
  }

  async onModuleDestroy() {
    this.discoveryInterval && clearTimeout(this.discoveryInterval);
  }

  private async channelDiscovery() {
    this.redisClient.setex(this.serviceId, 3, Date.now().toString());
    this.discoveryInterval = setTimeout(() => {
      this.channelDiscovery();
    }, 2000);
  }

  async sendMessage(
    userId: string,
    payload: string,
    fromRedisChannel: boolean,
  ) {
    this.socketGateway.connectedSockets[userId]?.forEach(socket =>
      socket.send(payload),
    );
    if (!fromRedisChannel) {
      this.redisClient.keys('SOCKET_CHANNEL_*', (err, ids) => {
        ids
          .filter(p => p != this.serviceId)
          .forEach(id => {
            this.publisherClient.publish(
              id,
              JSON.stringify({
                payload,
                userId,
              }),
            );
          });
      });
    }
  }
}
