type DeletePort = {
  isUnlinked: (userId: string) => Promise<boolean>;
  unlink: (kakaoId: string) => Promise<void>;
  markUnlinked: (userId: string) => Promise<void>;
  remove: (userId: string) => Promise<void>;
};
export async function deleteAccount(
  userId: string,
  kakaoId: string,
  port: DeletePort,
) {
  if (!(await port.isUnlinked(userId))) {
    await port.unlink(kakaoId);
    await port.markUnlinked(userId);
  }
  await port.remove(userId);
}
