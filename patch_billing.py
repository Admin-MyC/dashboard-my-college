with open('src/modules/BillingConceptsModule.tsx', 'r') as f:
    text = f.read()

pos_close_div = text.find('        )}\n      </div>\n\n      {activeFolderTab === \'descuentos\' ? (')

if pos_close_div != -1:
    old_snippet = "        )}\n      </div>\n\n      {activeFolderTab === 'descuentos' ? (\n        <DiscountsManager primaryColor={primaryColor} secondaryColor={secondaryColor} />\n      ) : ("
    new_snippet = """        )}

        {/* Pestaña Tipo Carpeta: Corte General de Cobros */}
        <button
          type="button"
          onClick={() => setActiveFolderTab('corte')}
          className={`group relative flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-3 sm:py-3.5 rounded-t-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-t-2 border-x-2 shrink-0 ${
            activeFolderTab === 'corte'
              ? 'bg-white text-slate-900 border-slate-300 shadow-xs -mb-[2px] z-10'
              : 'bg-slate-100/90 hover:bg-slate-200/70 text-slate-600 border-transparent hover:text-slate-800'
          }`}
          style={activeFolderTab === 'corte' ? { borderTopColor: '#059669' } : undefined}
        >
          <FileSpreadsheet className={`w-4 h-4 ${activeFolderTab === 'corte' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="font-extrabold tracking-tight">Corte</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
              activeFolderTab === 'corte' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}
          >
            .xlsx
          </span>
        </button>
      </div>

      {activeFolderTab === 'corte' ? (
        <BillingCorteModule primaryColor={primaryColor} secondaryColor={secondaryColor} />
      ) : activeFolderTab === 'descuentos' ? (
        <DiscountsManager primaryColor={primaryColor} secondaryColor={secondaryColor} />
      ) : ("
    if old_snippet in text:
        text = text.replace(old_snippet, new_snippet)
        with open('src/modules/BillingConceptsModule.tsx', 'w') as f:
            f.write(text)
        print('SUCCESS: Replaced with patch_billing.py')
    else:
        print('old_snippet not exact, index was:', pos_close_div)
else:
    print('pos_close_div not found')
