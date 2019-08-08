import styled from "@emotion/styled";

const Button = styled.button`
  color: #000;
  background-color: #fff;
  border: none;
  padding: 4px;
  margin: 0 4px;
  border-radius: 8px;
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  outline: none !important;
  font-size: 1em;

  &:hover {
    background-color: #2ee59d;
    box-shadow: 0px 5px 10px rgba(46, 229, 157, 0.4);
    color: #fff;
  }
`;

export const SmallButton = Button;

export const LargeButton = styled(Button)`
  padding: 4px 16px;
`;
