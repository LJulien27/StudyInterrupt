interface Question {
    type: QuestionType;
    text: string;
    body: string;
    answer: string;
  }
enum QuestionType {
    SINGLESELECT = 1,
    MULTISELECT = 2,
    FILLBLANK = 3,
    ASSOCIATION = 4
}

    export default Question;
    export { QuestionType };