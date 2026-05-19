import { describe, it, expect } from 'vitest';
import { parseQuizText } from './quizParser';

describe('quizParser - DUNG_SAI questions', () => {
  it('should parse bracketed answers at the end of statement lines', () => {
    const input = `
Câu 1: Chiến tranh giành độc lập của 13 thuộc địa Anh ở Bắc Mỹ.
1. Góp phần giải phóng Bắc Mỹ khỏi sự thống trị của thực dân Anh. [Đúng]
2. Mở đường cho kinh tế tư bản chủ nghĩa phát triển. [Đúng]
3. Thiết lập chế độ phong kiến thống nhất ở Bắc Mỹ. [Sai]
4. Do giai cấp vô sản lãnh đạo. [Sai]
    `;

    const result = parseQuizText(input);
    expect(result.errors).toHaveLength(0);
    expect(result.questions).toHaveLength(1);

    const question = result.questions[0];
    expect(question.title).toBe('Chiến tranh giành độc lập của 13 thuộc địa Anh ở Bắc Mỹ.');
    expect(question.type).toBe('truefalse');
    
    // Check statements and clean texts
    expect(question.statements[0].text).toBe('Góp phần giải phóng Bắc Mỹ khỏi sự thống trị của thực dân Anh.');
    expect(question.statements[0].answer).toBe(true);

    expect(question.statements[1].text).toBe('Mở đường cho kinh tế tư bản chủ nghĩa phát triển.');
    expect(question.statements[1].answer).toBe(true);

    expect(question.statements[2].text).toBe('Thiết lập chế độ phong kiến thống nhất ở Bắc Mỹ.');
    expect(question.statements[2].answer).toBe(false);

    expect(question.statements[3].text).toBe('Do giai cấp vô sản lãnh đạo.');
    expect(question.statements[3].answer).toBe(false);
  });

  it('should parse unbracketed capitalized answers at the end of lines', () => {
    const input = `
Câu 2: Cách mạng tư sản Pháp.
1. Lật đổ chế độ phong kiến chuyên chế. Đúng
2. Thiết lập nền cộng hòa sơ khai. Đúng
3. Do liên minh quý tộc và tăng lữ lãnh đạo. Sai
4. Không ảnh hưởng đến các nước châu Âu khác. Sai.
    `;

    const result = parseQuizText(input);
    expect(result.questions).toHaveLength(1);
    const question = result.questions[0];

    expect(question.statements[0].text).toBe('Lật đổ chế độ phong kiến chuyên chế.');
    expect(question.statements[0].answer).toBe(true);

    expect(question.statements[1].text).toBe('Thiết lập nền cộng hòa sơ khai.');
    expect(question.statements[1].answer).toBe(true);

    expect(question.statements[2].text).toBe('Do liên minh quý tộc và tăng lữ lãnh đạo.');
    expect(question.statements[2].answer).toBe(false);

    expect(question.statements[3].text).toBe('Không ảnh hưởng đến các nước châu Âu khác.');
    expect(question.statements[3].answer).toBe(false);
  });

  it('should parse standalone answers on newlines', () => {
    const input = `
Câu 3: Nguyên nhân bùng nổ Cách mạng tư sản Anh.
1. Mâu thuẫn giữa tư sản và quý tộc mới với phong kiến.
[Đúng]
2. Vua Sác-lơ I giải tán Quốc hội.
Đúng
3. Sự ủng hộ của thế lực phong kiến bên ngoài.
[Sai].
4. Sự phát triển mạnh mẽ của giai cấp công nhân Anh.
Sai.
    `;

    const result = parseQuizText(input);
    expect(result.questions).toHaveLength(1);
    const question = result.questions[0];

    expect(question.statements[0].text).toBe('Mâu thuẫn giữa tư sản và quý tộc mới với phong kiến.');
    expect(question.statements[0].answer).toBe(true);

    expect(question.statements[1].text).toBe('Vua Sác-lơ I giải tán Quốc hội.');
    expect(question.statements[1].answer).toBe(true);

    expect(question.statements[2].text).toBe('Sự ủng hộ của thế lực phong kiến bên ngoài.');
    expect(question.statements[2].answer).toBe(false);

    expect(question.statements[3].text).toBe('Sự phát triển mạnh mẽ của giai cấp công nhân Anh.');
    expect(question.statements[3].answer).toBe(false);
  });

  it('should NOT remove normal words inside sentence meaning', () => {
    const input = `
Câu 4: Nhận định về chủ nghĩa tư bản.
1. Sự phát triển của độc quyền là đúng quy luật khách quan.
2. Khẳng định chủ nghĩa tư bản luôn đúng là sai lầm.
3. Không phải lúc nào nhận định cũng sai.
4. Một số ý kiến cho rằng điều này là Đúng
    `;

    const result = parseQuizText(input);
    expect(result.questions).toHaveLength(1);
    const question = result.questions[0];

    // Statement 1: "là đúng quy luật" -> "đúng" is normal word
    expect(question.statements[0].text).toBe('Sự phát triển của độc quyền là đúng quy luật khách quan.');
    expect(question.statements[0].answer).toBeNull();

    // Statement 2: "là sai lầm" -> "sai" is part of "sai lầm"
    expect(question.statements[1].text).toBe('Khẳng định chủ nghĩa tư bản luôn đúng là sai lầm.');
    expect(question.statements[1].answer).toBeNull();

    // Statement 3: "cũng sai" -> "sai" at the end of statement, but lowercase and no punctuation before it, so it is treated as normal word
    expect(question.statements[2].text).toBe('Không phải lúc nào nhận định cũng sai.');
    expect(question.statements[2].answer).toBeNull();

    // Statement 4: "là Đúng" -> capitalized "Đúng" at the end but without punctuation separation, so it should be treated as normal word and NOT extracted
    expect(question.statements[3].text).toBe('Một số ý kiến cho rằng điều này là Đúng');
    expect(question.statements[3].answer).toBeNull();
  });

  it('should cleanly extract and trim trailing answer markers', () => {
    const input = `
Câu 5: Test trim và dấu câu.
1. Nội dung câu hỏi. Đúng
2. Nội dung câu hỏi... [Sai]
3. Nội dung câu hỏi - Đúng
4. Nội dung câu hỏi: Sai.
    `;

    const result = parseQuizText(input);
    expect(result.questions).toHaveLength(1);
    const question = result.questions[0];

    expect(question.statements[0].text).toBe('Nội dung câu hỏi.');
    expect(question.statements[0].answer).toBe(true);

    expect(question.statements[1].text).toBe('Nội dung câu hỏi...');
    expect(question.statements[1].answer).toBe(false);

    expect(question.statements[2].text).toBe('Nội dung câu hỏi');
    expect(question.statements[2].answer).toBe(true);

    expect(question.statements[3].text).toBe('Nội dung câu hỏi');
    expect(question.statements[3].answer).toBe(false);
  });
});
