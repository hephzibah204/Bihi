import { getAIRouter } from './services/aiRouter';

const testAI = async () => {
    const aiRouter = getAIRouter();
    const response = await aiRouter.generate('Tell me a joke');
    console.log(response);
};

testAI();
