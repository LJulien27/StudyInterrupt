import './MyQuizContent.css';


const MyQuizContent = () => {

  return (
    <div className="Wrap">
      <aside className="quiz-content-left"></aside>
      <main className="quiz-content-middle">
        <div className="main-grid">

          <div className="subgrid-add-file">
            <div className="item-subgrid-add-file-1">
              <button>ADD FILE</button>
            </div>
            <div className="item-subgrid-add-file-2">{"<"}uploaded file name{">"}</div>
            <div className="item-subgrid-add-file-3">
              <button>UPLOAD</button>
            </div>
          </div>
          <div className="subgrid-uploaded-files-container">
            <div className="uploaded-files-title">Uploaded Files</div>
            <div className="uploaded-files-item">EVS1101_Chapter1_Introduction.pdf</div>
            <div className="uploaded-files-item">EVS1101_Chapter2_HabitableEarth.pdf</div>
            <div className="uploaded-files-item">EVS1101_Chapter3_Geosphere.pdf</div>
            <div className="uploaded-files-item">EVS1101_Chapter4_Hydrosphere.pdf</div>
          </div>
          <div className="subgrid-generated-material">
            <div className="generated-material-title">Generated Material</div>
          </div>
      
        </div>
      </main>
      <aside className="quiz-content-right"></aside>
    </div>

  );
};

export default MyQuizContent;
