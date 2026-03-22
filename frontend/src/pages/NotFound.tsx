import { useLocation } from 'react-router';

const NotFound = () => {
  const { pathname } = useLocation();
  
  return (
    <div>
      <h1 className="text-4xl mb-4">Pagina niet gevonden</h1>
      <p>Er is geen pagina met als url {pathname}, probeer iets anders.</p>
    </div>
  );
};

export default NotFound;