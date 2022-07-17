const bcrypt = require('bcryptjs');

const Question = require('../../models/questionModel');
const User = require('../../models/userModel');
const Answer = require('../../models/answerModel');
const Tag = require('../../models/tagModel');

const crawledQuestions = require('../../data/crawled-questions.json');
const crawledAnswers = require('../../data/crawled-answers.json');
const crawledUsers = require('../../data/crawled-users.json');
const crawledTags = require('../../data/crawled-tags.json');
const mongoUsers = require('../../data/mongo-users.json');
const mongoTags = require('../../data/mongo-tags.json');

const { ROLE } = require('../contants/constants');

const randomUserId = (userList) => {
  const user = userList[Math.floor(Math.random() * userList.length)];
  return user._id.$oid;
};

const initTags = async () => {
  try {
    for (let i = 0; i < crawledTags.length; i++) {
      const tag = await Tag.create({ name: crawledTags[i] });
      console.log(i, ' - ', tag);
    }
  } catch (error) {
    console.log(error);
  }
};

const initUsers = async () => {
  try {
    for (let i = 0; i < crawledUsers.length; i++) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        process.env.DEFAULT_PASSWORD || 'abc123',
        salt
      );
      const displayName = crawledUsers[i];
      const user = await User.create({
        displayName,
        email: `${crawledUsers[i]}@gmail.com`,
        password: hashedPassword,
        linkGithub: `https://github.com/${displayName}`,
        linkLinkedIn: `https://linkedin.com/${displayName}`,
        about: '',
        avatarImg: '',
        role: ROLE.MEMBER,
      });
      console.log(i, ' - ', user);
    }
  } catch (error) {
    console.log(error);
  }
};

const initQuestions = async () => {
  let order = 0;
  try {
    for (let i = 0; i < crawledQuestions.length; i++) {
      if (!(i % 50) && i !== 0) {
        order++;
      }
      const question = await Question.create({
        userId: randomUserId(mongoUsers),
        title: crawledQuestions[i].title,
        content: crawledQuestions[i].content,
        tags: [
          {
            _id: mongoTags[order]._id.$oid,
          },
        ],
      });
      console.log(i, ' - ', question);
    }
  } catch (error) {
    console.log(error);
  }
};

const initAnswers = async () => {
  try {
    const questions = await Question.find();

    if (questions.length > 0) {
      for (let i = 0; i < crawledAnswers.length; i++) {
        for (let j = 0; j < 3; j++) {
          const answer = await Answer.create({
            userId: randomUserId(mongoUsers),
            user: {},
            questionId: questions[i]._id,
            content: crawledAnswers[i * 3 + j],
            likesCount: 0,
            userLikes: {},
          });
          console.log(i, ' - ', answer);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const initUserLikes = async () => {
  const min = 15;
  const max = 25;
  try {
    const questions = await Question.find().sort({ createdAt: -1 }).limit(50);
    console.log(questions);
    for (let j = 0; j < questions.length; j++) {
      const answers = await Answer.find({ questionId: questions[j]._id.toString() });
      for (let k = 0; k < answers.length; k++) {
        const likesCount = Math.floor(Math.random() * (max - min) + min);
        let userLikes = {};
        for (let i = 0; i < likesCount; i++) {
          const userId = randomUserId(mongoUsers);
          userLikes[userId] = true;
        }
        const updatedAnswer = await Answer.findByIdAndUpdate(
          answers[k]._id,
          {
            userLikes,
            likesCount,
          },
          {
            new: true,
          }
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = { initQuestions, initAnswers, initUsers, initTags, initUserLikes };
