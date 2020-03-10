import { RequestResponseNext } from '..';
import response from '../../lib/response';
import { isRequired } from './questions.service';
import { createQuestion } from './questions.repository';
import { getQuestions } from './questions.repository';

const get: RequestResponseNext = async (req, res) => {
  try {
    const { number } = req.params;
    const { sum, questions } = await getQuestions({ number });
    // const sum = question.length;
    res.json(response({ status: 200, data: { sum, questions } }));
  } catch (e) {
    console.log(e);
    res.json(response({ status: 500, message: e.message }));
  }
};

const post: RequestResponseNext = async (req, res) => {
  try {
    if (isRequired(req.body)) {
      return res.json(response({ status: 412, message: '필수 파라이터가 없습니다.' }));
    }
    const question = await createQuestion(req.body);
    res.json(response({ status: 201, data: question }));
  } catch (e) {
    console.log(e);
    res.json(response({ status: 500, message: e.message }));
  }
};

export default { get, post };
