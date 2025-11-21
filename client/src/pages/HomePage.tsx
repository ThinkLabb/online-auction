import Products from '../components/list-product-about-to-end';
import MatrixRain from './MatrixRain';

function HomePage() {
  const handleScroll = () => {
    console.log("click button")
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });
  }
  return (<>
    <div className=''>
      <div className="flex-1 flex flex-col justify-center items-center bg-black relative text-white h-[85vh]" id="intro">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('./assets/background.png')] bg-no-repeat bg-center bg-contain opacity-40 z-1" />
        <MatrixRain color="#8D0000" speed={50} />

        <div className="relative z-10 text-center max-w-3xl px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-normal">
            EXPLORE WONDERFUL ITEMS <br /> WITH REASONABLE PRICES
          </h1>
          <button className="bg-white text-[#8D0000] px-6 py-2 rounded font-semibold hover:bg-[#8D0000] hover:text-white hover:cursor-pointer">
            Auction now!
          </button>
        </div>
        <div className="text-white animate-bounce absolute bottom-5 z-10 hover:cursor-pointer" id='scrollButton' onClick={handleScroll}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 8l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <Products />
    </div>
  </>
  );
}

export default HomePage;
