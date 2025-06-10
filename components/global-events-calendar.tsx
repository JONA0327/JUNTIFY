"use client"

export default function GlobalEventsCalendar() {
  return (
    <section className="relative bg-stone-50">
      <div className="bg-sky-400 w-full sm:w-40 h-40 rounded-full absolute top-1 opacity-20 max-sm:right-0 sm:left-56 z-0"></div>
      <div className="bg-emerald-500 w-full sm:w-40 h-24 absolute top-0 -left-0 opacity-20 z-0"></div>
      <div className="bg-purple-600 w-full sm:w-40 h-24 absolute top-40 -left-0 opacity-20 z-0"></div>
      <div className="w-full py-24 relative z-10 backdrop-blur-3xl">
        <div className="w-full max-w-7xl mx-auto px-2 lg:px-8">
          <div className="grid grid-cols-12 gap-8 max-w-4xl mx-auto xl:max-w-full">
            <div className="col-span-12 xl:col-span-5">
              <h2 className="font-manrope text-3xl leading-tight text-gray-900 mb-1.5">Próximos Eventos</h2>
              <p className="text-lg font-normal text-gray-600 mb-8">No pierdas tu agenda</p>
              <div className="flex gap-5 flex-col">
                <div className="p-6 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                      <p className="text-base font-medium text-gray-900">10 Ene 2024 - 10:00 - 11:00</p>
                    </div>
                    <div className="dropdown relative inline-flex">
                      <button type="button" className="dropdown-toggle inline-flex justify-center py-2.5 px-1 items-center gap-2 text-sm text-black rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="4" viewBox="0 0 12 4" fill="none">
                          <path d="M1.85624 2.00085H1.81458M6.0343 2.00085H5.99263M10.2124 2.00085H10.1707" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h6 className="text-xl leading-8 font-semibold text-black mb-1">Reunión con amigos</h6>
                  <p className="text-base font-normal text-gray-600">Conversación sobre destinos de viaje</p>
                </div>
                <div className="p-6 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                      <p className="text-base font-medium text-gray-900">10 Ene 2024 - 05:40 - 13:00</p>
                    </div>
                    <div className="dropdown relative inline-flex">
                      <button type="button" className="dropdown-toggle inline-flex justify-center py-2.5 px-1 items-center gap-2 text-sm text-black rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:text-sky-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="4" viewBox="0 0 12 4" fill="none">
                          <path d="M1.85624 2.00085H1.81458M6.0343 2.00085H5.99263M10.2124 2.00085H10.1707" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h6 className="text-xl leading-8 font-semibold text-black mb-1">Curso en línea</h6>
                  <p className="text-base font-normal text-gray-600">Revisar actualizaciones del curso de diseño</p>
                </div>
                <div className="p-6 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <p className="text-base font-medium text-gray-900">14 Ene 2024 10:00 - 11:00</p>
                    </div>
                    <div className="dropdown relative inline-flex">
                      <button type="button" className="dropdown-toggle inline-flex justify-center py-2.5 px-1 items-center gap-2 text-sm text-black rounded-full cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="4" viewBox="0 0 12 4" fill="none">
                          <path d="M1.85624 2.00085H1.81458M6.0343 2.00085H5.99263M10.2124 2.00085H10.1707" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h6 className="text-xl leading-8 font-semibold text-black mb-1">Reunión de desarrollo</h6>
                  <p className="text-base font-normal text-gray-600">Discusión con el equipo para el próximo proyecto</p>
                </div>
              </div>
            </div>
            <div className="col-span-12 xl:col-span-7 px-2.5 py-5 sm:p-8 bg-gradient-to-b from-white/25 to-white xl:bg-white rounded-2xl max-xl:row-start-1">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <h5 className="text-xl leading-8 font-semibold text-gray-900">Enero 2024</h5>
                  <div className="flex items-center">
                    <button className="text-indigo-600 p-1 rounded transition-all duration-300 hover:text-white hover:bg-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10.0002 11.9999L6 7.99971L10.0025 3.99719" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </button>
                    <button className="text-indigo-600 p-1 rounded transition-all duration-300 hover:text-white hover:bg-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6.00236 3.99707L10.0025 7.99723L6 11.9998" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center rounded-md p-1 bg-indigo-50 gap-px">
                  <button className="py-2.5 px-5 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium transition-all duration-300 hover:bg-indigo-600 hover:text-white">Día</button>
                  <button className="py-2.5 px-5 rounded-lg bg-indigo-600 text-white text-sm font-medium transition-all duration-300 hover:bg-indigo-600 hover:text-white">Semana</button>
                  <button className="py-2.5 px-5 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium transition-all duration-300 hover:bg-indigo-600 hover:text-white">Mes</button>
                </div>
              </div>
              <div className="border border-indigo-200 rounded-xl">
                <div className="grid grid-cols-7 rounded-t-3xl border-b border-indigo-200">
                  <div className="py-3.5 border-r rounded-tl-xl border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Dom</div>
                  <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Lun</div>
                  <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Mar</div>
                  <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Mié</div>
                  <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Jue</div>
                  <div className="py-3.5 border-r border-indigo-200 bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Vie</div>
                  <div className="py-3.5 rounded-tr-xl bg-indigo-50 flex items-center justify-center text-sm font-medium text-indigo-600">Sáb</div>
                </div>
                <div className="grid grid-cols-7 rounded-b-xl">
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50"><span className="text-xs font-semibold text-gray-400">27</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">28</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">29</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">30</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">31</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">1</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">2</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 relative bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">3</span><div className="absolute top-9 bottom-1 left-3.5 p-1.5 xl:px-2.5 h-max rounded bg-purple-50"><p className="hidden xl:block text-xs font-medium text-purple-600 mb-px">Reunión</p><span className="hidden xl:block text-xs font-normal text-purple-600 whitespace-nowrap">10:00 - 11:00</span><p className="xl:hidden w-2 h-2 rounded-full bg-purple-600"></p></div></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">4</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">5</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">6</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 relative bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">7</span><div className="absolute top-9 bottom-1 left-3.5 p-1.5 xl:px-2.5 h-max rounded bg-emerald-50"><p className="hidden xl:block text-xs font-medium text-emerald-600 mb-px whitespace-nowrap">Developer Meetup</p><span className="hidden xl:block text-xs font-normal text-emerald-600 whitespace-nowrap">10:00 - 11:00</span><p className="xl:hidden w-2 h-2 rounded-full bg-emerald-600"></p></div></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">8</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-indigo-600 sm:text-white sm:w-6 sm:h-6 rounded-full sm:flex items-center justify-center sm:bg-indigo-600">9</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">10</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">11</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">12</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">13</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">14</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">15</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">16</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">17</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">18</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 relative bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">19</span><div className="absolute top-9 bottom-1 left-3.5 p-1.5 xl:px-2.5 h-max rounded bg-sky-50"><p className="hidden xl:block text-xs font-medium text-sky-600 mb-px whitespace-nowrap">Developer Meetup</p><span className="hidden xl:block text-xs font-normal text-sky-600 whitespace-nowrap">10:00 - 11:00</span><p className="xl:hidden w-2 h-2 rounded-full bg-sky-600"></p></div></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">20</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">21</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">22</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">23</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">24</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">25</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">26</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">27</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">28</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">29</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-b border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">30</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-white border-r border-indigo-200 rounded-bl-xl transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-900">31</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">1</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">2</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">3</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 relative bg-gray-50 border-r border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">4</span><div className="absolute top-9 bottom-1 left-3.5 p-1.5 xl:px-2.5 h-max rounded bg-purple-50"><p className="hidden xl:block text-xs font-medium text-purple-600 mb-px whitespace-nowrap">Amigos</p><span className="hidden xl:block text-xs font-normal text-purple-600 whitespace-nowrap">09:00 - 13:42</span><p className="xl:hidden w-2 h-2 rounded-full bg-purple-600"></p></div></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-r border-indigo-200 transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">5</span></div>
                  <div className="flex xl:aspect-square max-xl:min-h-[60px] p-3.5 bg-gray-50 border-indigo-200 rounded-br-xl transition-all duration-300 hover:bg-indigo-50 cursor-pointer"><span className="text-xs font-semibold text-gray-400">6</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

