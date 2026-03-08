import { ServiceComparison as ServiceComparisonType } from '@/types/article';

interface ServiceComparisonProps {
  comparison: ServiceComparisonType;
}

export default function ServiceComparison({ comparison }: ServiceComparisonProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{comparison.title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-gray-600 font-medium bg-gray-50">
                Criteria
              </th>
              {comparison.services.map(service => (
                <th
                  key={service}
                  className="px-4 py-3 text-left text-gray-900 font-semibold bg-gray-50 whitespace-nowrap"
                >
                  {service}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.criteria.map((criterion, i) => (
              <tr
                key={criterion.criterion}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                <td className="px-4 py-3 text-gray-700 font-medium border-r border-gray-100">
                  {criterion.criterion}
                </td>
                {comparison.services.map(service => (
                  <td
                    key={service}
                    className="px-4 py-3 text-gray-600"
                  >
                    {criterion.values[service] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
