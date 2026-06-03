#!/bin/bash

# Fix all .spec.ts files with proper providers

for spec_file in $(find src -name "*.spec.ts"); do
  echo "Fixing: $spec_file"
  
  # Check if it's a service spec or component spec
  if [[ $spec_file == *"service.spec.ts" ]] || [[ $spec_file == *"interceptor.spec.ts" ]]; then
    # Service specs - add provideHttpClient and provideHttpClientTesting
    sed -i '' \
      '/TestBed.configureTestingModule({$/,/^  })/{ 
        /TestBed.configureTestingModule({$/a\
    providers: [\
      provideHttpClient(),\
      provideHttpClientTesting()\
    ]
      }' "$spec_file"
  else
    # Component/Guard specs - add provideHttpClient and provideRouter
    sed -i '' \
      '/await TestBed.configureTestingModule({$/,/^    })/{ 
        /await TestBed.configureTestingModule({$/a\
      providers: [\
        provideHttpClient(),\
        provideRouter([])\
      ]
      }' "$spec_file"
  fi
done

echo "Done fixing all spec files"
