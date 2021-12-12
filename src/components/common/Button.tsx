import { ReactNode } from 'react';
interface Props {
  onClick: () => void
  children: ReactNode
}

export const Button = (props: Props) => {
  return <button
    onClick={props.onClick}
    className=" bg-gray-800 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md"
  >{props.children}</button>
};
