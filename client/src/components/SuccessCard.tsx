// src/components/SuccessCard.tsx

import "./SuccessCard.css"; // Import the custom CSS

interface SuccessCardProps {
  title?: string;
  paragraph?: string;
  listItems?: string[];
  buttonText?: string;
}

const SuccessCard = ({
  title = "Keys to Success in Your Career",
  paragraph = "Best ways to thrive in local job opportunities.",
  listItems = [
    "Build a Strong Skills Profile",
    "Network Locally",
    "Continuous Skill Development",
    "Set Career Goals",
    "Stay Persistent and Positive",
  ],
  buttonText = "Start Your Journey",
}: SuccessCardProps) => {
  return (
    <div className="card max-w-sm mx-auto md:max-w-md"> {/* Added Tailwind for responsiveness */}
      <div className="card__border"></div>
      <div className="card_title__container">
        <span className="card_title">{title}</span>
        <p className="card_paragraph">{paragraph}</p>
      </div>
      <hr className="line" />
      <ul className="card__list">
        {listItems.map((item, index) => (
          <li key={index} className="card__list_item">
            <span className="check">
              <svg
                className="check_svg"
                fill="currentColor"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </span>
            <span className="list_text">{item}</span>
          </li>
        ))}
      </ul>
      <button className="button">{buttonText}</button>
    </div>
  );
};

export default SuccessCard;