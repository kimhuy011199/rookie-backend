const NOTI_ACTIONS = {
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  SEND_NOTI: 'send_notification',
  RECEIVE_NOTI: 'receive_notification',
};

const ITEMS_PER_PAGE = {
  ANSWER: 10,
  QUESTION: 5,
  TAG: 10,
  USER: 2,
};

const NOTIFICATION_TYPE = {
  ANSWER_QUESTION: 1,
  LIKE_COMMENT: 2,
};

const ROLE = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

module.exports = {
  NOTI_ACTIONS,
  ITEMS_PER_PAGE,
  NOTIFICATION_TYPE,
  ROLE,
};
