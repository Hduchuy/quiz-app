
import { parseQuestions } from './src/utils/questionParser.js';

const sampleText = `
[SINGLE]
Câu 1: Thủ đô của Việt Nam là gì?
A. Hải Phòng
*B. Hà Nội
C. Đà Nẵng
D. Huế

[TRUE_FALSE]
Câu 2: Kiểm tra kiến thức
1. Mặt trời mọc ở hướng Đông. [Đúng]
2. Cá voi là cá. [Sai]

[MATCH]
LEFT:
1|A
2|B
RIGHT:
X|1
Y|2
CORRECT:
1=X
2=Y

[CLOZE]
TEXT:
Hà Nội là {{thủ đô}} của Việt Nam.
`;

try {
    const questions = parseQuestions(sampleText);
    console.log("Parsed Questions Count:", questions.length);
    console.log("Questions:", JSON.stringify(questions, null, 2));
} catch (e) {
    console.error("Parsing failed:", e);
}
