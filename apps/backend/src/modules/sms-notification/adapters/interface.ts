export interface SmsAdapter {
  send(params: { to: string; body: string }): Promise<void>
}
